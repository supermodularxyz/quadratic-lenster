// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;

import "./MetaPtr.sol";

interface IRoundImplementation {
    /// @notice Emitted when a team metadata pointer is updated
    event MetaPtrUpdated(MetaPtr oldMetaPtr, MetaPtr newMetaPtr);

    /// @notice Update projectsMetaPtr (only by ROUND_OPERATOR_ROLE)
    /// @param newProjectsMetaPtr new ProjectsMetaPtr
    function updateProjectsMetaPtr(MetaPtr calldata newProjectsMetaPtr) external;

    /**
     * @notice Invoked by collection module to allow collector to  to cast
     * vote for grants during a round.
     *
     * @dev
     * - allows contributor to do cast multiple votes which could be weighted.
     * - should be invoked by collectionModule contract
     * - ideally IVotingStrategy implementation should emit events after a vote is cast
     * - this would be triggered when a post is collected through the QuadraticFundingCollectionModule.
     *
     * @param _encodedVotes encoded votes
     */
    function vote(bytes[] calldata _encodedVotes) external;
}
