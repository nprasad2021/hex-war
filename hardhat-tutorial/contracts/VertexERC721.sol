// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;
import "hardhat/console.sol";

/// @author Neeraj Prasad <neeruj.prasad@gmail.com>
/// @notice ERC721 implementation forked from ArtGobblers
abstract contract VertexERC721 {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed id
    );

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 indexed id
    );

    event ApprovalForAll(
        address indexed owner,
        address indexed operator,
        bool approved
    );

    /*//////////////////////////////////////////////////////////////
                         METADATA STORAGE/LOGIC
    //////////////////////////////////////////////////////////////*/

    string public name;

    string public symbol;

    function tokenURI(uint256 id) external pure returns (string memory) {
        return "";
    }

    /*//////////////////////////////////////////////////////////////
                         VERTEX/ERC721 STORAGE
    //////////////////////////////////////////////////////////////*/

    struct Position {
        int32 a;
        int32 b;
        int32 c;
    }

    Position[6] validLocations;

    /// @notice Struct holding vertex data.
    struct VertexData {
        // token id
        uint256 id;
        // The current owner of the vertex.
        address owner;
        // hex coordinates.
        Position loc;
        // Multiple --> # of vertexes surrounding gobblers..
        uint32 emissionMultiple;
        uint64 lastTimestamp;
    }

    mapping(int32 => mapping(int32 => mapping(int32 => uint256))) getTokenId;

    mapping(uint256 => VertexData) public getVertex;

    /// @notice Struct holding data relevant to each user's account.
    struct UserData {
        uint32 vertexesOwned;
    }

    /// @notice Maps user addresses to their account data.
    mapping(address => UserData) public getUserData;

    function ownerOf(uint32 id) external view returns (address owner) {
        require((owner = getVertex[id].owner) != address(0), "NOT_MINTED");
    }

    function isVertexValid(
        int32 a,
        int32 b,
        int32 c
    ) public pure returns (bool) {
        // invalid hex coordinate (always say is minted)
        if ((a + b + c) % 3 == 0) {
            return false;
        }
        return true;
    }

    function getOwner(
        int32 a,
        int32 b,
        int32 c
    ) public view returns (address) {
        return getVertex[getTokenId[a][b][c]].owner;
    }

    function isVertexMintable(
        int32 a,
        int32 b,
        int32 c
    ) public view returns (bool) {
        return isVertexValid(a, b, c) && (getTokenId[a][b][c] == 0);
    }

    function getEmissionMultipleFromHex(
        address owner,
        int32 a,
        int32 b,
        int32 c
    ) public view returns (uint32) {
        // vertexes are not allowed
        if (isVertexValid(a, b, c)) {
            return 0;
        }
        uint32 count = 0;
        unchecked {
            if (getOwner(a + 1, b, c) == owner) {
                count = count + 1;
            }
            if (getOwner(a - 1, b, c) == owner) {
                count = count + 1;
            }
            if (getOwner(a, b + 1, c) == owner) {
                count = count + 1;
            }
            if (getOwner(a, b - 1, c) == owner) {
                count = count + 1;
            }
            if (getOwner(a, b, c + 1) == owner) {
                count = count + 1;
            }
            if (getOwner(a, b, c - 1) == owner) {
                count = count + 1;
            }
        }
        return count;
    }

    function max(uint32 a, uint32 b) public pure returns (uint32) {
        return a >= b ? a : b;
    }

    function getEmissionMultiple(
        int32 a,
        int32 b,
        int32 c
    ) public view returns (uint32) {
        require(isVertexValid(a, b, c), "location not a vertex");
        require(getOwner(a, b, c) != address(0), "no owner for vertex");
        address owner = getOwner(a, b, c);

        uint32 count = 0;
        unchecked {
            count = max(count, getEmissionMultipleFromHex(owner, a + 1, b, c));
            count = max(count, getEmissionMultipleFromHex(owner, a - 1, b, c));
            count = max(count, getEmissionMultipleFromHex(owner, a, b + 1, c));
            count = max(count, getEmissionMultipleFromHex(owner, a, b - 1, c));
            count = max(count, getEmissionMultipleFromHex(owner, a, b, c + 1));
            count = max(count, getEmissionMultipleFromHex(owner, a, b, c - 1));
        }
        return count;
    }

    function getNextVertex(
        int32 a,
        int32 b,
        int32 c
    ) public returns (Position memory pos) {
        //  6 possible places
        uint256 index = 0;
        unchecked {
            if (isVertexMintable(a + 1, b, c)) {
                validLocations[index] = Position(a + 1, b, c);
                index = index + 1;
            }
            if (isVertexMintable(a - 1, b, c)) {
                validLocations[index] = Position(a - 1, b, c);
                index = index + 1;
            }
            if (isVertexMintable(a, b + 1, c)) {
                validLocations[index] = Position(a, b + 1, c);
                index = index + 1;
            }
            if (isVertexMintable(a, b - 1, c)) {
                validLocations[index] = Position(a, b - 1, c);
                index = index + 1;
            }
            if (isVertexMintable(a, b, c + 1)) {
                validLocations[index] = Position(a, b, c + 1);
                index = index + 1;
            }
            if (isVertexMintable(a, b, c - 1)) {
                validLocations[index] = Position(a, b, c - 1);
                index = index + 1;
            }
        }
        console.log("numValidLocations", index);
        require(index > 0, "no valid spots available to mint");
        return validLocations[block.timestamp % index];
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "ZERO_ADDRESS");

        return getUserData[owner].vertexesOwned;
    }

    /*//////////////////////////////////////////////////////////////
                         ERC721 APPROVAL STORAGE
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => address) public getApproved;

    mapping(address => mapping(address => bool)) public isApprovedForAll;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    /*//////////////////////////////////////////////////////////////
                              ERC721 LOGIC
    //////////////////////////////////////////////////////////////*/

    function approve(address spender, uint256 id) external {
        address owner = getVertex[id].owner;

        require(
            msg.sender == owner || isApprovedForAll[owner][msg.sender],
            "NOT_AUTHORIZED"
        );

        getApproved[id] = spender;

        emit Approval(owner, spender, id);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;

        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(
        address from,
        address to,
        uint256 id
    ) public virtual;

    function safeTransferFrom(
        address from,
        address to,
        uint256 id
    ) external {
        transferFrom(from, to, id);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes calldata data
    ) external {
        transferFrom(from, to, id);
    }

    /*//////////////////////////////////////////////////////////////
                              ERC165 LOGIC
    //////////////////////////////////////////////////////////////*/

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        returns (bool)
    {
        return
            interfaceId == 0x01ffc9a7 || // ERC165 Interface ID for ERC165
            interfaceId == 0x80ac58cd || // ERC165 Interface ID for ERC721
            interfaceId == 0x5b5e139f; // ERC165 Interface ID for ERC721Metadata
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL MINT LOGIC
    //////////////////////////////////////////////////////////////*/

    function _mint(
        address to,
        uint256 id,
        int32 a,
        int32 b,
        int32 c
    ) internal {
        require(isVertexMintable(a, b, c)); // require that location has not been minted
        require(getVertex[id].owner == address(0)); // require that token-id as not been minted yet

        // update number owned
        ++getUserData[to].vertexesOwned;
        // update timestamp
        getVertex[id].lastTimestamp = uint64(block.timestamp);

        getVertex[id].owner = to;
        console.log("set owner");
        getVertex[id].loc = Position(a, b, c);
        console.log("set position");
        getTokenId[a][b][c] = id;

        emit Transfer(address(0), to, id);
    }
}
