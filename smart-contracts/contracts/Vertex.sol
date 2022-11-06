// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import {Owned} from "./Owned.sol";
import {LibGOO} from "./LibGoo.sol";
import {LibString} from "./LibString.sol";
import {FixedPointMathLib} from "./FixedPointMathLib.sol";
import {toWadUnsafe, toDaysWadUnsafe} from "./SignedWadMath.sol";
import "hardhat/console.sol";

import {VertexERC721} from "./VertexERC721.sol";

import {Resource} from "./Resource.sol";

/// @title HexWar
/// @author Neeraj Prasad <neeruj.prasad@gmail.com>
/// @notice forked from ArtGobblers - FrankieIsLost <frankie@paradigm.xyz> transmissions11 <t11s@paradigm.xyz>
contract Vertex is VertexERC721, Owned {
    using LibString for uint256;
    using FixedPointMathLib for uint256;

    Resource resource;
    uint256 lastMintedId;
    Position startingPosition;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() VertexERC721("Vertex", "VERTEX") Owned(msg.sender) {
        lastMintedId = 1; // must start at 1
    }

    function setResource(Resource _resource) public {
        resource = _resource;
    }

    function getLastMintedId() public view returns (uint256) {
        return lastMintedId;
    }

    /*//////////////////////////////////////////////////////////////
                              MINTING LOGIC
    //////////////////////////////////////////////////////////////*/
    function startingMint() public returns (uint256) {
        console.log(uint64(block.timestamp));
        startingPosition = getNextVertex(0, 0, 0);
        uint256 mintedId = lastMintedId;
        console.log("minting");
        _mint(
            msg.sender,
            mintedId,
            startingPosition.a,
            startingPosition.b,
            startingPosition.c
        );
        console.log("minted");
        ++lastMintedId;
        return mintedId;
    }

    /// @param ownedVertexId whether the cost is paid from the
    /// @return mintedId id of the gobbler that was minted.
    function mintFromResource(uint256 ownedVertexId) public returns (uint256) {
        console.log(uint64(block.timestamp));
        require(msg.sender == getVertex[ownedVertexId].owner, "WRONG_SENDER");
        // require 20s interval since last attempt
        VertexData memory v = getVertex[ownedVertexId];
        require(
            (uint64(block.timestamp) - v.lastTimestamp) > 20,
            "at least 20s required"
        );
        uint32 emissionMultiple = getVertexEmissionMultiple(ownedVertexId);
        if (uint64(block.timestamp) % 8 > emissionMultiple) {
            // rip
            v.lastTimestamp = uint64(block.timestamp);
            return 0;
        }

        v.lastTimestamp = uint64(block.timestamp);
        Position memory nextPosition = getNextVertex(v.loc.a, v.loc.b, v.loc.c);

        uint256 mintedId = lastMintedId;
        _mint(
            msg.sender,
            mintedId,
            nextPosition.a,
            nextPosition.b,
            nextPosition.c
        );
        ++lastMintedId;
        return mintedId;
    }

    /*//////////////////////////////////////////////////////////////
                          CONVENIENCE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Convenience function to get emissionMultiple for a vertex.
    /// @param vertexId The vertex to get emissionMultiple for.
    function getVertexLocation(uint256 vertexId)
        external
        view
        returns (
            int32,
            int32,
            int32
        )
    {
        return (
            getVertex[vertexId].loc.a,
            getVertex[vertexId].loc.b,
            getVertex[vertexId].loc.c
        );
    }

    /// @notice Convenience function to get emissionMultiple for a vertex.
    /// @param vertexId The vertex to get emissionMultiple for.
    function getVertexData(uint256 vertexId)
        public
        view
        returns (VertexData memory v)
    {
        return getVertex[vertexId];
    }

    /// @notice Convenience function to get emissionMultiple for a vertex.
    /// @param vertexId The vertex to get emissionMultiple for.
    function getVertexEmissionMultiple(uint256 vertexId)
        public
        view
        returns (uint32)
    {
        Position memory v = getVertex[vertexId].loc;
        return getEmissionMultiple(v.a, v.b, v.c);
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
            getVertex[id].lastTimestamp = uint64(block.timestamp);

            // We update their last balance before updating their emission multiple to avoid
            // penalizing them by retroactively applying their new (lower) emission multiple.
            getUserData[from].vertexesOwned -= 1;

            // We update their last balance before updating their emission multiple to avoid
            // overpaying them by retroactively applying their new (higher) emission multiple.
            getUserData[to].vertexesOwned += 1;
        }

        emit Transfer(from, to, id);
    }
}
