// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "hardhat/console.sol";

import {ICollectModule} from './lens/interfaces/ICollectModule.sol';
import {Errors} from './lens/libraries/Errors.sol';
import {FeeModuleBase} from './lens//FeeModuleBase.sol';
import {ModuleBase} from './lens/ModuleBase.sol';
import {FollowValidationModuleBase} from './lens/FollowValidationModuleBase.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {IERC721} from '@openzeppelin/contracts/token/ERC721/IERC721.sol';


contract QuadraticFundingCollectModule {
    string public greeting;

    constructor(string memory _hub) {
       
    }

}
