// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "hardhat/console.sol";

import { ICollectModule } from "./interfaces/ICollectModule.sol";
import { Errors } from "./libraries/Errors.sol";
import { FeeModuleBase } from "./FeeModuleBase.sol";
import { ModuleBase } from "./ModuleBase.sol";

import { FollowValidationModuleBase } from "./FollowValidationModuleBase.sol";

import "./interfaces/IRoundImplementation.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";


/**
 * @notice A struct containing the necessary data to execute collect actions on a publication.
 *
 * @param amount The collecting cost associated with this publication.
 * @param currency The currency associated with this publication.
 * @param collectLimit The maximum number of collects for this publication. 0 for no limit.
 * @param currentCollects The current number of collects for this publication.
 * @param recipient The recipient address associated with this publication.
 * @param referralFee The referral fee associated with this publication.
 * @param followerOnly True if only followers of publisher may collect the post.
 * @param endTimestamp The end timestamp after which collecting is impossible. 0 for no expiry.
 */
struct ProfilePublicationData {
    uint256 amount;
    address currency;
    uint96 collectLimit;
    uint96 currentCollects;
    address recipient;
    uint16 referralFee;
    bool followerOnly;
    uint72 endTimestamp;
    address grantsRoundAddress;
    address votingStrategyAddress;
}

contract QuadraticVoteCollectModule is FeeModuleBase, FollowValidationModuleBase, ICollectModule, ERC165 {
    using SafeERC20 for IERC20;

    mapping(uint256 => mapping(uint256 => ProfilePublicationData)) internal _dataByPublicationByProfile;

    /**
     * @dev Mapping of valid vote signature digests
     */
    mapping(bytes32 => bool) internal _validVotes;

    IRoundImplementation public roundImplementation;

    constructor(address _lensHub, address _moduleGlobals) FeeModuleBase(_moduleGlobals) ModuleBase(_lensHub) {}

    function initializePublicationCollectModule(
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external returns (bytes memory) {
        (
            uint256 amount,
            address currency,
            address recipient,
            uint16 referralFee,
            bool followerOnly,
            address grantsRoundAddress,
            address votingStrategyAddress
        ) = abi.decode(data, (uint256, address, address, uint16, bool, address, address));
        if (!_currencyWhitelisted(currency) || recipient == address(0) || referralFee > BPS_MAX || amount == 0)
            revert Errors.InitParamsInvalid();

        _dataByPublicationByProfile[profileId][pubId].amount = amount;
        _dataByPublicationByProfile[profileId][pubId].currency = currency;
        _dataByPublicationByProfile[profileId][pubId].recipient = recipient;
        _dataByPublicationByProfile[profileId][pubId].referralFee = referralFee;
        _dataByPublicationByProfile[profileId][pubId].followerOnly = followerOnly;
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
        if (_dataByPublicationByProfile[profileId][pubId].followerOnly) _checkFollowValidity(profileId, collector);
        if (referrerProfileId == profileId) {
            _processCollect(collector, profileId, pubId, data);
        } else {
            _processCollectWithReferral(referrerProfileId, collector, profileId, pubId, data);
        }
    }

    function _processCollect(address collector, uint256 profileId, uint256 pubId, bytes calldata data) internal {
        /// decode  data
        (address _currency, uint256 _amount) = abi.decode(data, (address, uint256));
        address grantsRoundAddress = _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress;
        uint256 roundStartTime = IRoundImplementation(grantsRoundAddress).roundStartTime();
        uint256 roundEndTime = IRoundImplementation(grantsRoundAddress).roundEndTime();
        require(block.timestamp > roundStartTime && block.timestamp < roundEndTime, "Round is not in session");

        //validate data
        uint256 amount = _dataByPublicationByProfile[profileId][pubId].amount;
        address currency = _dataByPublicationByProfile[profileId][pubId].currency;
        _validateDataIsExpected(data, currency, amount);
        //check signature validity

        //transfer erc20 from collector to this contract
        IERC20(_currency).safeTransferFrom(collector, address(this), _amount);

        // address recipient = _dataByPublicationByProfile[profileId][pubId].recipient;
        address treasury;
        uint256 treasuryAmount;

        // Avoids stack too deep
        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (amount * treasuryFee) / BPS_MAX;
        }

        uint256 adjustedAmount = amount - treasuryAmount;

        //cast vote
        _vote(profileId, pubId, adjustedAmount, data);

        if (treasuryAmount > 0) {
            IERC20(_currency).safeTransfer(treasury, treasuryAmount);
        }
    }

    function _processCollectWithReferral(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) internal {
        /// decode  data
        (address _currency, uint256 _amount) = abi.decode(data, (address, uint256));
        {
            uint256 roundStartTime = IRoundImplementation(
                _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress
            ).roundStartTime();
            uint256 roundEndTime = IRoundImplementation(
                _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress
            ).roundEndTime();
            require(block.timestamp > roundStartTime && block.timestamp < roundEndTime, "Round is not in session");
        }
        
        uint256 amount = _dataByPublicationByProfile[profileId][pubId].amount;
        address currency = _dataByPublicationByProfile[profileId][pubId].currency;
        uint256 referralFee = _dataByPublicationByProfile[profileId][pubId].referralFee;
        //validate data
        _validateDataIsExpected(data, currency, amount);

        //transfer erc20 from collector to this contract
        IERC20(_currency).safeTransferFrom(collector, address(this), _amount);

        // address recipient = _dataByPublicationByProfile[profileId][pubId].recipient;
        address treasury;
        uint256 treasuryAmount;
        uint256 adjustedAmount;

        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (amount * treasuryFee) / BPS_MAX;
            adjustedAmount = amount - treasuryAmount;
        }

        if (referralFee != 0) {
            // Avoids stack too deep
            {
                uint256 referralAmount = (adjustedAmount * referralFee) / BPS_MAX;
                adjustedAmount = amount - treasuryAmount - referralAmount;
                _processReferral(referrerProfileId, referralAmount, currency);
            }
            // The reason we levy the referral fee on the adjusted amount is so that referral fees
            // don't bypass the treasury fee, in essence referrals pay their fair share to the treasury.
        }
        //address recipient = _dataByPublicationByProfile[profileId][pubId].recipient;

        if (treasuryAmount != 0) {
            IERC20(currency).safeTransfer(treasury, treasuryAmount);
        }

        //cast vote
        _vote(profileId, pubId, adjustedAmount, data);
    }

    function _vote(uint256 profileId, uint256 pubId, uint256 adjustedAmount, bytes calldata data) internal {
        (address _currency, ) = abi.decode(data, (address, uint256));

        address grantsRoundAddress = _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress;
        address votingStrategyAddress = _dataByPublicationByProfile[profileId][pubId].votingStrategyAddress;

        // encode vote
        bytes memory vote = abi.encode(_currency, adjustedAmount, grantsRoundAddress);

        /// declare votes array
        bytes[] memory votes = new bytes[](1);

        /// cast vote into array because that's how gitcoin likes it.
        votes[0] = vote;

        // approve voting strategy to spend erc20
        IERC20(_currency).approve(votingStrategyAddress, adjustedAmount);

        /// vote
        IRoundImplementation(grantsRoundAddress).vote(votes);
    }

    function _processReferral(uint256 referrerProfileId, uint256 referralAmount, address currency) internal {
        //address referralRecipient = _dataByPublicationByProfile[profileId][pubId].recipient;

        address referralRecipient = IERC721(HUB).ownerOf(referrerProfileId);

        // Send referral fee in normal ERC20 tokens
        IERC20(currency).safeTransfer(referralRecipient, referralAmount);
    }

    /******************************************************/
    /* ERC165 interface */
    /******************************************************/

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC165) returns (bool) {
        return
            interfaceId == type(IERC20).interfaceId ||
            super.supportsInterface(interfaceId);
    }

}
