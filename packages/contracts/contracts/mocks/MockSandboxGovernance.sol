// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ILensHub} from '../interfaces/ILensHub.sol';
import {DataTypes} from '../libraries/DataTypes.sol';

/**
 * @title MockSandboxGovernance
 * @author Lens Protocol
 *
 * @notice This is a proxy contract that allows calling some onlyGov functions on Sandbox deployment.
 * @notice Only whitelisting of Follow/Reference/Collect modules are allowed to be called publicly.
 * @notice The rest of onlyGov functions are restricted to this contract's owner.
 */
contract MockSandboxGovernance {
    ILensHub public immutable LENS_HUB;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, 'Only owner can call this');
        _;
    }

    constructor(ILensHub hub, address owner_) {
        LENS_HUB = hub;
        owner = owner_;
    }

    /////////////////////////////////
    // Publicly available functions
    /////////////////////////////////

    /**
     * @notice Adds or removes a follow module from the whitelist.
     *
     * @param followModule The follow module contract address to add or remove from the whitelist.
     * @param whitelist Whether or not the follow module should be whitelisted.
     */
    function whitelistFollowModule(address followModule, bool whitelist) external {
        LENS_HUB.whitelistFollowModule(followModule, whitelist);
    }

    /**
     * @notice Adds or removes a reference module from the whitelist.
     *
     * @param referenceModule The reference module contract to add or remove from the whitelist.
     * @param whitelist Whether or not the reference module should be whitelisted.
     */
    function whitelistReferenceModule(address referenceModule, bool whitelist) external {
        LENS_HUB.whitelistReferenceModule(referenceModule, whitelist);
    }

    /**
     * @notice Adds or removes a collect module from the whitelist.
     *
     * @param collectModule The collect module contract address to add or remove from the whitelist.
     * @param whitelist Whether or not the collect module should be whitelisted.
     */
    function whitelistCollectModule(address collectModule, bool whitelist) external {
        LENS_HUB.whitelistCollectModule(collectModule, whitelist);
    }

    ///////////////////////////
    // Only Owner functions
    ///////////////////////////

    /**
     * @notice Sets the privileged governance role. This function can only be called by the current owner
     * address.
     *
     * @param newGovernance The new governance address to set.
     */
    function setGovernance(address newGovernance) external onlyOwner {
        LENS_HUB.setGovernance(newGovernance);
    }

    /**
     * @notice Sets the emergency admin, which is a permissioned role able to set the protocol state. This function
     * can only be called by the owner address.
     *
     * @param newEmergencyAdmin The new emergency admin address to set.
     */
    function setEmergencyAdmin(address newEmergencyAdmin) external onlyOwner {
        LENS_HUB.setEmergencyAdmin(newEmergencyAdmin);
    }

    /**
     * @notice Sets the protocol state to either a global pause, a publishing pause or an unpaused state. This function
     * can only be called by the owner address.
     *
     * @param newState The state to set, as a member of the ProtocolState enum.
     */
    function setState(DataTypes.ProtocolState newState) external onlyOwner {
        LENS_HUB.setState(newState);
    }

    /**
     * @notice Adds or removes a profile creator from the whitelist. This function can only be called by the current
     * owner address.
     *
     * @param profileCreator The profile creator address to add or remove from the whitelist.
     * @param whitelist Whether or not the profile creator should be whitelisted.
     */
    function whitelistProfileCreator(address profileCreator, bool whitelist) external onlyOwner {
        LENS_HUB.whitelistProfileCreator(profileCreator, whitelist);
    }

    ///////////////////////////
    // Owner management
    ///////////////////////////

    /**
     * @notice Changes the owner of this contract. This function can only be called by the current owner address.
     *
     * @param newOwner Address of the new owner to be assigned.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), 'New owner cannot be zero');
        owner = newOwner;
    }
}