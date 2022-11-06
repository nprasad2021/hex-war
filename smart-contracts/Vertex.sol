// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Owned} from "./Owned.sol";
import {LibString} from "solmate/utils/LibString.sol";
import {FixedPointMathLib} from "solmate/utils/FixedPointMathLib.sol";
import {toWadUnsafe, toDaysWadUnsafe} from "solmate/utils/SignedWadMath.sol";
import {LibGOO} from "./LibGoo";

import {VertexERC721} from "./VertexERC721.sol";

import {Resource} from "./Resource.sol";

/// @title HexWar
/// @author Neeraj Prasad <neeruj.prasad@gmail.com>
/// forked from @author FrankieIsLost <frankie@paradigm.xyz> @author transmissions11 <t11s@paradigm.xyz>
contract Vertex is VertexERC721, Owned {
    using LibString for uint256;
    using FixedPointMathLib for uint256;

    /// @notice The address of the Resource ERC20 token contract.
    Resource public immutable resource;
    uint256 lastMintedId;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _resource Address of the Resource contract.
    constructor(
        // Addresses:
        Resource _resource
    ) VertexERC721("Vertex", "VERTEX") Owned(msg.sender) {
        resource = _resource;
        lastMintedId = 0;
    }

    /*//////////////////////////////////////////////////////////////
                              MINTING LOGIC
    //////////////////////////////////////////////////////////////*/
    function startingMint() public returns (uint256 lastMintedId) {
        require(msg.sender == getVertex[ownedVertexId].owner, "WRONG_SENDER");
        VertexData v = getVertex[ownedVertexId];
        Position p = new Position(0, 0, 0);
        Position nextPosition = getNextVertex(p);
        _mint(msg.sender, lastMintedId, nextPosition);
        ++lastMintedId;
    }

    /// @param useVirtualBalance Whether the cost is paid from the
    /// @param ownedVertex whether the cost is paid from the
    /// user's virtual goo balance, or from their ERC20 goo balance.
    /// @return vertexId The id of the gobbler that was minted.
    function mintFromResource(uint256 ownedVertexId, bool useVirtualBalance)
        public
        returns (uint256 lastMintedId)
    {
        require(msg.sender == getVertex[ownedVertexId].owner, "WRONG_SENDER");
        VertexData v = getVertex[ownedVertexId];
        Position nextPosition = getNextVertex(v.loc);
        // check if it's possible to min the
        // No need to check if we're at MAX_MINTABLE,
        uint256 currentPrice = 10;

        // Decrement the user's goo balance by the current
        // price, either from virtual balance or ERC20 balance.
        useVirtualBalance
            ? updateUserGooBalance(
                msg.sender,
                currentPrice,
                ResourceBalanceUpdateType.DECREASE
            )
            : resource.burnForVertex(msg.sender, currentPrice);

        _mint(msg.sender, lastMintedId, nextPosition);
        ++lastMintedId;
    }

    /// @notice Calculate a user's virtual goo balance.
    /// @param user The user to query balance for.
    function resourceBalance(address user) public view returns (uint256) {
        // Compute the user's virtual goo balance using LibGOO.
        // prettier-ignore
        return LibGOO.computeGOOBalance(
            getUserData[user].emissionMultiple,
            getUserData[user].lastBalance,
            uint256(toDaysWadUnsafe(block.timestamp - getUserData[user].lastTimestamp))
        );
    }

    /// @notice Add goo to your emission balance,
    /// burning the corresponding ERC20 balance.
    /// @param gooAmount The amount of goo to add.
    function addResource(uint256 resourceAmount) external {
        // Burn goo being added to gobbler.
        resource.burnForVertex(msg.sender, resourceAmount);

        // Increase msg.sender's virtual goo balance.
        updateUserResourceBalance(
            msg.sender,
            resourceAmount,
            ResourceBalanceUpdateType.INCREASE
        );
    }

    /// @notice Remove goo from your emission balance, and
    /// add the corresponding amount to your ERC20 balance.
    /// @param gooAmount The amount of goo to remove.
    function removeResource(uint256 resourceAmount) external {
        // Decrease msg.sender's virtual goo balance.
        updateUserResourceBalance(
            msg.sender,
            resourceAmount,
            ResourceBalanceUpdateType.DECREASE
        );

        // Mint the corresponding amount of ERC20 goo.
        resource.mintFromVertex(msg.sender, resourceAmount);
    }

    /// @dev An enum for representing whether to
    /// increase or decrease a user's goo balance.
    enum ResourceBalanceUpdateType {
        INCREASE,
        DECREASE
    }

    /// @notice Update a user's virtual goo balance.
    /// @param user The user whose virtual goo balance we should update.
    /// @param resourceAmount The amount of goo to update the user's virtual balance by.
    /// @param updateType Whether to increase or decrease the user's balance by resourceAmount.
    function updateUserResourceBalance(
        address user,
        uint256 resourceAmount,
        ResourceBalanceUpdateType updateType
    ) internal {
        // Will revert due to underflow if we're decreasing by more than the user's current balance.
        // Don't need to do checked addition in the increase case, but we do it anyway for convenience.
        uint256 updatedBalance = updateType ==
            ResourceBalanceUpdateType.INCREASE
            ? resourceBalance(user) + resourceAmount
            : resourceBalance(user) - gooAmount;

        // Snapshot the user's new goo balance with the current timestamp.
        getUserData[user].lastBalance = uint128(updatedBalance);
        getUserData[user].lastTimestamp = uint64(block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                          CONVENIENCE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Convenience function to get emissionMultiple for a vertex.
    /// @param vertexId The vertex to get emissionMultiple for.
    function getVertexEmissionMultiple(uint256 vertexId)
        external
        view
        returns (uint256)
    {
        return getVertex[vertexId].emissionMultiple;
    }

    /// @notice Convenience function to get emissionMultiple for a user.
    /// @param user The user to get emissionMultiple for.
    function getUserEmissionMultiple(address user)
        external
        view
        returns (uint256)
    {
        return getUserData[user].emissionMultiple;
    }

    /*//////////////////////////////////////////////////////////////
                              ERC721 LOGIC
    //////////////////////////////////////////////////////////////*/

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public override {
        require(from == getVertex[id].owner, "WRONG_FROM");

        require(to != address(0), "INVALID_RECIPIENT");

        require(
            msg.sender == from ||
                isApprovedForAll[from][msg.sender] ||
                msg.sender == getApproved[id],
            "NOT_AUTHORIZED"
        );

        delete getApproved[id];

        getVertex[id].owner = to;

        unchecked {
            uint32 emissionMultiple = getVertex[id].emissionMultiple; // Caching saves gas.

            // We update their last balance before updating their emission multiple to avoid
            // penalizing them by retroactively applying their new (lower) emission multiple.
            getUserData[from].lastBalance = uint128(resourceBalance(from));
            getUserData[from].lastTimestamp = uint64(block.timestamp);
            getUserData[from].emissionMultiple -= emissionMultiple;
            getUserData[from].vertexesOwned -= 1;

            // We update their last balance before updating their emission multiple to avoid
            // overpaying them by retroactively applying their new (higher) emission multiple.
            getUserData[to].lastBalance = uint128(resourceBalance(to));
            getUserData[to].lastTimestamp = uint64(block.timestamp);
            getUserData[to].emissionMultiple += emissionMultiple;
            getUserData[to].vertexesOwned += 1;
        }

        emit Transfer(from, to, id);
    }
}
