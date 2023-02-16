// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import { ICollectModule } from "./interfaces/ICollectModule.sol";
import { Errors } from "./libraries/Errors.sol";
import { FeeModuleBase } from "./FeeModuleBase.sol";
import { ModuleBase } from "./ModuleBase.sol";

import "./interfaces/IRoundImplementation.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title QuadraticVotingCollectModule
 * @author mr_deadce11, bitbeckers
 * @notice Collect module for collecting posts and participating in Grants rounds
 */

/**
 * @notice A struct containing the necessary data to execute collect actions on a publication.
 * @param currency The currency associated with this publication.
 * @param referralFee The referral fee associated with this publication.
 * @param grantsRoundAddress True if only followers of publisher may collect the post.
 * @param endTimestamp The round end timestamp after which voting is blocked.
 */
struct ProfilePublicationData {
    address currency;
    address recipient;
    uint16 referralFee;
    address grantsRoundAddress;
    uint256 endTimestamp;
}

contract QuadraticVoteCollectModule is FeeModuleBase, ModuleBase, ICollectModule {
    using SafeERC20 for IERC20;

    mapping(uint256 => mapping(uint256 => ProfilePublicationData)) internal _dataByPublicationByProfile;

    /**
     * @notice Event emmitted when the vote is processed succesfully.
     * @param profileId The profile associated with this publication.
     * @param pubId The ID of the publication to be collected.
     * @param collector The address of the collector/voter.
     * @param currency The token address of the currency used for voting. Needs to be whitelisted in Lens
     * @param amount The original voting amount, before treasury or reference fees
     */
    event CollectWithVote(uint256 profileId, uint256 pubId, address collector, address currency, uint256 amount);

    //solhint-disable-next-line no-empty-blocks
    constructor(address _lensHub, address _moduleGlobals) FeeModuleBase(_moduleGlobals) ModuleBase(_lensHub) {}

    /**
     * @notice Init method for the Quadratic Voting Collect Module.
     * @param profileId The profile associated with this publication.
     * @param pubId The ID of the publication to be collected.
     * @param data The encoded data used for voting.
     * @dev Data contains:
     * @dev 1) address: voting token
     * @dev 2) uint256: referral fee in wei
     * @dev 3) address: grants round
     */
    function initializePublicationCollectModule(
        uint256 profileId,
        uint256 pubId,
        bytes calldata data
    ) external returns (bytes memory) {
        (address currency, uint16 referralFee, address grantsRoundAddress) = abi.decode(
            data,
            (address, uint16, address)
        );

        if (!_currencyWhitelisted(currency) || referralFee > BPS_MAX) revert Errors.InitParamsInvalid();
        uint256 endTimestamp = IRoundImplementation(grantsRoundAddress).roundEndTime();

        _dataByPublicationByProfile[profileId][pubId].currency = currency;
        _dataByPublicationByProfile[profileId][pubId].referralFee = referralFee;
        _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress = grantsRoundAddress;
        _dataByPublicationByProfile[profileId][pubId].endTimestamp = endTimestamp;

        return data;
    }

    /**
     * @notice Method for collecting the post and voting on the profile in the Grants round
     * @param referrerProfileId The post referrer.
     * @param collector The address of the collector.
     * @param profileId The ID of the publication to be collected.
     * @param pubId The ID of the publication to be collected.
     * @param data The encoded data used for voting.
     * @dev Data contains:
     * @dev 1) address: voting token
     * @dev 2) uint256: voting amount in wei
     */
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

    /**
     * @notice Process a collect-vote without referral fee.
     * @notice If the round has expired, the funds are sent to the owner of the profileId.
     * @param collector The address of the collector.
     * @param profileId The ID of the publication to be collected.
     * @param pubId The ID of the publication to be collected.
     * @param data The encoded data used for voting.
     * @dev Data contains:
     * @dev 1) address: voting token
     * @dev 2) uint256: voting amount in wei
     */
    function _processCollect(address collector, uint256 profileId, uint256 pubId, bytes calldata data) internal {
        (address _currency, uint256 _amount) = abi.decode(data, (address, uint256));
        uint256 endTimestamp = _dataByPublicationByProfile[profileId][pubId].endTimestamp;

        _validateDataIsExpected(data, _currency, _amount);

        address treasury;
        uint256 treasuryAmount;
        uint256 adjustedAmount;

        // Avoids stack too deep
        {
            uint16 treasuryFee;
            (treasury, treasuryFee) = _treasuryData();
            treasuryAmount = (_amount * treasuryFee) / BPS_MAX;
            adjustedAmount = _amount - treasuryAmount;
        }

        if (treasuryAmount > 0) {
            IERC20(_currency).safeTransferFrom(collector, treasury, treasuryAmount);
        }

        //cast vote or transfer funds
        if (block.timestamp < endTimestamp) {
            _vote(collector, profileId, pubId, adjustedAmount, _currency);
        } else {
            IERC20(_currency).safeTransferFrom(collector, IERC721(HUB).ownerOf(profileId), adjustedAmount);
        }

        emit CollectWithVote(profileId, pubId, collector, _currency, adjustedAmount);
    }

    /**
     * @notice Process a collect-vote with referral fee.
     * @notice If the round has expired, the funds are sent to the owner of the profileId.
     * @param collector The address of the collector.
     * @param profileId The ID of the publication to be collected.
     * @param pubId The ID of the publication to be collected.
     * @param data The encoded data used for voting.
     * @dev Data contains:
     * @dev 1) address: voting token
     * @dev 2) uint256: voting amount in wei
     */
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
            // The reason we levy the referral fee on the adjusted amount is so that referral fees
            // don't bypass the treasury fee, in essence referrals pay their fair share to the treasury.
            // Avoids stack too deep
            uint256 referralAmount = (adjustedAmount * referralFee) / BPS_MAX;
            adjustedAmount = _amount - treasuryAmount - referralAmount;

            address referralRecipient = IERC721(HUB).ownerOf(referrerProfileId);

            // Send referral fee in normal ERC20 tokens
            IERC20(_currency).safeTransferFrom(collector, referralRecipient, referralAmount);
        }

        if (treasuryAmount != 0) {
            IERC20(_currency).safeTransferFrom(collector, treasury, treasuryAmount);
        }

        //cast vote
        if (block.timestamp < _dataByPublicationByProfile[profileId][pubId].endTimestamp) {
            _vote(collector, profileId, pubId, adjustedAmount, _currency);
        } else {
            {
                IERC20(_currency).safeTransferFrom(collector, IERC721(HUB).ownerOf(profileId), adjustedAmount);
            }
        }

        emit CollectWithVote(profileId, pubId, collector, _currency, adjustedAmount);
    }

    /**
     * @notice Submit a vote to the selected grants round.
     * @param voter The address of the collector.
     * @param profileId The ID of the publication to be collected.
     * @param pubId The ID of the publication to be collected.
     * @param amount The encoded data used for voting.
     * @param currency The encoded data used for voting.
     */
    function _vote(address voter, uint256 profileId, uint256 pubId, uint256 amount, address currency) internal {
        address grantsRoundAddress = _dataByPublicationByProfile[profileId][pubId].grantsRoundAddress;
        // encode vote
        bytes memory vote = abi.encode(voter, currency, amount, grantsRoundAddress, profileId);

        /// declare votes array
        bytes[] memory votes = new bytes[](1);

        /// cast vote into array because that's how gitcoin likes it.
        votes[0] = vote;

        /// vote
        IRoundImplementation(grantsRoundAddress).vote(votes);
    }

    function getPublicationData(
        uint256 profileId,
        uint256 pubId
    ) external view returns (ProfilePublicationData memory) {
        return _dataByPublicationByProfile[profileId][pubId];
    }
}
