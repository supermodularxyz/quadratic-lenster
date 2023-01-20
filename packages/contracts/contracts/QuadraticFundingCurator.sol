// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.10;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./interfaces/IRoundImplementation.sol";

contract QuadraticFundingCurator is AccessControl, Pausable {
    // --- Libraries ---
    using Address for address;

    // --- Roles ---

    /// @notice program operator role
    bytes32 public constant PROGRAM_OPERATOR_ROLE = keccak256("PROGRAM_OPERATOR");
    bytes32 public constant CURATOR_ADMIN_ROLE = keccak256("CURATOR_ADMIN");

    // --- State ---

    address grantRound;

    // --- Events ---
    event GrantsRoundUpdated(address newAddress);

    constructor(address grantRoundAddress, address operator) {
        grantRound = grantRoundAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CURATOR_ADMIN_ROLE, msg.sender);
        _grantRole(PROGRAM_OPERATOR_ROLE, operator);
    }

    function updateMetaPtr(MetaPtr memory newRoundMetaPtr) external whenNotPaused onlyRole(PROGRAM_OPERATOR_ROLE) {
        IRoundImplementation(grantRound).updateProjectsMetaPtr(newRoundMetaPtr);
    }

    function updateGrantRoundAddress(address updatedGrantRoundAddress) external onlyRole(CURATOR_ADMIN_ROLE) {
        grantRound = updatedGrantRoundAddress;
        emit GrantsRoundUpdated(grantRound);
    }

    function pause() external onlyRole(CURATOR_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CURATOR_ADMIN_ROLE) {
        _unpause();
    }
}
