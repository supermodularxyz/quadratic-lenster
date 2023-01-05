// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.17;


import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


//import "./IPayoutStrategy.sol";

import "./mocks/MetaPtr.sol";

contract QuadraticFundingCuratorContract is AccessControlEnumerable, Initializable {
  // --- Libraries ---
  using Address for address;

  // --- Roles ---

  /// @notice program operator role
  bytes32 public constant PROGRAM_OPERATOR_ROLE = keccak256("PROGRAM_OPERATOR");

  // --- Events ---

  /// @notice Emitted when a team metadata pointer is updated
  event MetaPtrUpdated(MetaPtr oldMetaPtr, MetaPtr newMetaPtr);

  // --- Data ---

  /// @notice URL pointing for program metadata (for off-chain use)
  MetaPtr public metaPtr;
    constructor() {
        
    }



      function updateRoundMetaPtr(MetaPtr memory newRoundMetaPtr) external onlyRole(PROGRAM_OPERATOR_ROLE) {

      }
}