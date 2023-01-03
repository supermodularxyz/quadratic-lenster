// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.17;


import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./gitcoin/votingStrategy/IVotingStrategy.sol";
import "./gitcoin/payoutStrategy/IPayoutStrategy.sol";

import "./gitcoin/utils/MetaPtr.sol";

