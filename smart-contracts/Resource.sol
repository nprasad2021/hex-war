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

    /// @notice The address of the Art Gobblers contract.
    address public immutable Vertex;

    error Unauthorized();

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Sets the addresses of relevant contracts.
    /// @param _vertexAddress of the Vertex contract.
    constructor(address _vertexAddress) {
        Vertex = _vertexAddress;
    }

    /*//////////////////////////////////////////////////////////////
                             MINT/BURN LOGIC
    //////////////////////////////////////////////////////////////*/

    /// @notice Requires caller address to match user address.
    modifier only(address user) {
        if (msg.sender != user) revert Unauthorized();

        _;
    }

    /// @notice Mint any amount of goo to a user. Can only be called by ArtGobblers.
    /// @param to The address of the user to mint goo to.
    /// @param amount The amount of goo to mint.
    function mintFromVertex(address to, uint256 amount) external only(Vertex) {
        _mint(to, amount);
    }

    /// @notice Burn any amount of goo from a user. Can only be called by ArtGobblers.
    /// @param from The address of the user to burn goo from.
    /// @param amount The amount of goo to burn.
    function burnForSettlements(address from, uint256 amount)
        external
        only(Vertex)
    {
        _burn(from, amount);
    }
}
