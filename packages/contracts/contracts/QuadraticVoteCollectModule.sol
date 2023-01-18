// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "hardhat/console.sol";

import { ICollectModule } from "./interfaces/ICollectModule.sol";
import { Errors } from "./libraries/Errors.sol";
import { FeeModuleBase } from "./FeeModuleBase.sol";
import { ModuleBase } from "./ModuleBase.sol";

import "./interfaces/IRoundImplementation.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice A struct containing the necessary data to execute collect actions on a publication.
 *
 * @param currency The currency associated with this publication.
 * @param referralFee The referral fee associated with this publication.
 * @param followerOnly True if only followers of publisher may collect the post.
 * @param endTimestamp The end timestamp after which collecting is impossible. 0 for no expiry.
 */
struct ProfilePublicationData {
    address currency;
    uint16 referralFee;
    address grantsRoundAddress;
    address votingStrategyAddress;
}

contract QuadraticVoteCollectModule is FeeModuleBase, ModuleBase, ICollectModule {
    using SafeERC20 for IERC20;

    mapping(uint256 => mapping(uint256 => ProfilePublicationData)) internal _dataByPublicationByProfile;

    /**
     * @dev Mapping of valid vote signature digests
     */
    mapping(bytes32 => bool) internal _validVotes;

    constructor(address _lensHub, address _moduleGlobals) FeeModuleBase(_moduleGlobals) ModuleBase(_lensHub) {}

    function initializePublicationCollectModule(
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external returns (bytes memory) {
        (address currency, uint16 referralFee, address grantsRoundAddress, address votingStrategyAddress) = abi.decode(
            data,
            (address, uint16, address, address)
        );

        if (!_currencyWhitelisted(currency) || referralFee > BPS_MAX) revert Errors.InitParamsInvalid();

        _dataByPublicationByProfile[profileId][pubId].currency = currency;
        _dataByPublicationByProfile[profileId][pubId].referralFee = referralFee;
        _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress = grantsRoundAddress;
        _dataByPublicationByProfile[profileId][pubId].votingStrategyAddress = votingStrategyAddress;

        return data;
    }

    function processCollect(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external {
        if (referrerProfileId == profileId) {
            _processCollect(collector, profileId, pubId, data);
        } else {
            _processCollectWithReferral(referrerProfileId, collector, profileId, pubId, data);
        }
    }

    function _processCollect(address collector, uint256 profileId, uint256 pubId, bytes calldata data) internal {
        (address _currency, uint256 _amount) = abi.decode(data, (address, uint256));

        _validateDataIsExpected(data, _currency, _amount);

        address treasury;
        uint256 treasuryAmount;

        // Avoids stack too deep
        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (_amount * treasuryFee) / BPS_MAX;
        }

        uint256 adjustedAmount = _amount - treasuryAmount;

        if (treasuryAmount > 0) {
            IERC20(_currency).safeTransferFrom(collector, treasury, treasuryAmount);
        }

        //cast vote
        _vote(profileId, pubId, adjustedAmount, _currency);
    }

    function _processCollectWithReferral(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) internal {
        (address _currency, uint256 _amount) = abi.decode(data, (address, uint256));

        uint256 referralFee = _dataByPublicationByProfile[profileId][pubId].referralFee;
        _validateDataIsExpected(data, _currency, _amount);

        address treasury;
        uint256 treasuryAmount;
        uint256 adjustedAmount;

        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (_amount * treasuryFee) / BPS_MAX;
            adjustedAmount = _amount - treasuryAmount;
        }

        if (referralFee != 0) {
            // Avoids stack too deep
            {
                uint256 referralAmount = (adjustedAmount * referralFee) / BPS_MAX;
                adjustedAmount = _amount - treasuryAmount - referralAmount;
                address referralRecipient = IERC721(HUB).ownerOf(referrerProfileId);

                // Send referral fee in normal ERC20 tokens
                IERC20(_currency).safeTransferFrom(collector, referralRecipient, referralAmount);
            }
        }

        if (treasuryAmount != 0) {
            IERC20(_currency).safeTransferFrom(collector, treasury, treasuryAmount);
        }

        //cast vote
        _vote(profileId, pubId, adjustedAmount, _currency);
    }

    function _vote(uint256 profileId, uint256 pubId, uint256 amount, address currency) internal {
        address grantsRoundAddress = _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress;
        address votingStrategyAddress = _dataByPublicationByProfile[profileId][pubId].votingStrategyAddress;

        // encode vote
        bytes memory vote = abi.encode(currency, amount);

        /// declare votes array
        bytes[] memory votes = new bytes[](1);

        /// cast vote into array because that's how gitcoin likes it.
        votes[0] = vote;

        // approve voting strategy to spend erc20
        IERC20(currency).approve(votingStrategyAddress, amount);

        /// vote
        // TODO find way to not have contract as msg.sender
        IRoundImplementation(grantsRoundAddress).vote(votes);
    }
}
