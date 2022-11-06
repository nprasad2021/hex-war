// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {ERC20} from "./ERC20.sol";

/// @title Resource Token (RES)
// forked from the following:
/// @author FrankieIsLost <frankie@paradigm.xyz>
/// @author transmissions11 <t11s@paradigm.xyz>
/// @notice Goo is the in-game token for ArtGobblers. It's a standard ERC20
/// token that can be burned and minted by the gobblers and pages contract.
contract Resource is ERC20("Resource", "RESOURCE", 18) {
    /*//////////////////////////////////////////////////////////////
                                ADDRESSES
    //////////////////////////////////////////////////////////////*/

    address vertex;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {}

    function setVertex(address _vertex) public {
        vertex = _vertex;
    }

    /*//////////////////////////////////////////////////////////////
                             MINT/BURN LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Requires caller address to match user address.
    modifier only(address user) {
        if (msg.sender != user) revert();

        _;
    }

    /// @notice Mint any amount of resource to a user. Can only be called by Vertex .
    /// @param to The address of the user to mint Resource to.
    /// @param amount The amount of Resource to mint.
    function mintFromVertex(address to, uint256 amount) external only(vertex) {
        _mint(to, amount);
    }

    /// @notice Burn any amount of Resource from a user. Can only be called by Vertex .
    /// @param from The address of the user to burn Resource from.
    /// @param amount The amount of Resource to burn.
    function burnForVertex(address from, uint256 amount) external only(vertex) {
        _burn(from, amount);
    }
}
