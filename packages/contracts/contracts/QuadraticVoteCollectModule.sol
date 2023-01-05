// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "hardhat/console.sol";

import { ICollectModule } from "./interfaces/ICollectModule.sol";
import { Errors } from "./libraries/Errors.sol";
import { FeeModuleBase } from "./FeeModuleBase.sol";
import { ModuleBase } from "./ModuleBase.sol";

//todo switch to correct import when deploying
import { FollowValidationModuleBase } from "./mocks/MockFollowValidationModuleBase.sol";
//import {FollowValidationModuleBase} from './FollowValidationModuleBase.sol';

import "./interfaces/IRoundImplementation.sol";

import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

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
}

contract QuadraticVoteCollectModule is FeeModuleBase, FollowValidationModuleBase, ICollectModule, IERC1271, ERC165 {
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
        (uint256 amount, address currency, address recipient, uint16 referralFee, bool followerOnly) = abi.decode(
            data,
            (uint256, address, address, uint16, bool)
        );
        if (!_currencyWhitelisted(currency) || recipient == address(0) || referralFee > BPS_MAX || amount == 0)
            revert Errors.InitParamsInvalid();

        _dataByPublicationByProfile[profileId][pubId].amount = amount;
        _dataByPublicationByProfile[profileId][pubId].currency = currency;
        _dataByPublicationByProfile[profileId][pubId].recipient = recipient;
        _dataByPublicationByProfile[profileId][pubId].referralFee = referralFee;
        _dataByPublicationByProfile[profileId][pubId].followerOnly = followerOnly;

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
        //decode data;
        /// decode  data
        (
            address _currency,
            uint256 _amount,
            address grantsRoundAddress,
            address votingStrategyAddress,
            uint256 roundStartTime,
            uint256 roundEndTime
        ) = abi.decode(data, (address, uint256, address, address,uint256, uint256));
        require(block.timestamp > roundStartTime && block.timestamp < roundEndTime, "Round is not in session");

        //check signature validity

        //transfer erc20 from collector to this contract
        IERC20(_currency).safeTransferFrom(collector, address(this), _amount);

        //validate data
        uint256 amount = _dataByPublicationByProfile[profileId][pubId].amount;
        address currency = _dataByPublicationByProfile[profileId][pubId].currency;
        _validateDataIsExpected(data, currency, amount);

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
        _vote(adjustedAmount, data);

        if (treasuryAmount > 0) {
           IERC20(_currency).approve(address(treasury), adjustedAmount); 
           IERC20(_currency).safeTransferFrom(address(this), treasury, treasuryAmount);
        }
    }

    function _vote(uint256 adjustedAmount, bytes calldata data) internal {
        (
            address _currency,
            uint256 _amount,
            address grantsRoundAddress,
            address votingStrategyAddress,
            uint256 roundStartTime,
            uint256 roundEndTime
        ) = abi.decode(data, (address, uint256, address, address,uint256, uint256));

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

    function _processCollectWithReferral(
        uint256 referrerProfileId,
        address collector,
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) internal {
        uint256 amount = _dataByPublicationByProfile[profileId][pubId].amount;
        address currency = _dataByPublicationByProfile[profileId][pubId].currency;
        _validateDataIsExpected(data, currency, amount);

        uint256 referralFee = _dataByPublicationByProfile[profileId][pubId].referralFee;
        address treasury;
        uint256 treasuryAmount;

        // Avoids stack too deep
        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (amount * treasuryFee) / BPS_MAX;
        }

        uint256 adjustedAmount = amount - treasuryAmount;

        if (referralFee != 0) {
            // The reason we levy the referral fee on the adjusted amount is so that referral fees
            // don't bypass the treasury fee, in essence referrals pay their fair share to the treasury.
            uint256 referralAmount = (adjustedAmount * referralFee) / BPS_MAX;
            adjustedAmount = adjustedAmount - referralAmount;

            address referralRecipient = IERC721(HUB).ownerOf(referrerProfileId);

            // Send referral fee in normal ERC20 tokens
            IERC20(currency).safeTransferFrom(collector, referralRecipient, referralAmount);
        }
        address recipient = _dataByPublicationByProfile[profileId][pubId].recipient;

        if (treasuryAmount > 0) {
            IERC20(currency).safeTransferFrom(collector, treasury, treasuryAmount);
        }
    }

    /******************************************************/
    /* ERC165 interface */
    /******************************************************/

    /**
     * @inheritdoc IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC165) returns (bool) {
        return
            interfaceId == type(IERC1271).interfaceId ||
            interfaceId == type(IERC20).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /******************************************************/
    /* EIP1271 implementation */
    /******************************************************/

    /**
     * @notice Verify vote and signature are both valid
     * @param digest EIP712 vote digest
     * @param signature Signature Vote digest
     * @return Magic value on valid signature, 0xffffffff otherwise
     */
    function isValidSignature(bytes32 digest, bytes calldata signature) public view returns (bytes4) {
        signature;
        return _validVotes[digest] ? bytes4(0x1626ba7e) : bytes4(0xffffffff);
    }
}
