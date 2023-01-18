// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.10;

abstract contract IRoundImplementation {
    function roundStartTime() public view virtual returns (uint256);

    function roundEndTime() public view virtual returns (uint256);

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
    function vote(bytes[] calldata _encodedVotes) external payable virtual;
}
