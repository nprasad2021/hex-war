// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

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

    function tokenURI(uint256 id) external view virtual returns (string memory);

    /*//////////////////////////////////////////////////////////////
                         VERTEX/ERC721 STORAGE
    //////////////////////////////////////////////////////////////*/

    struct Position {
        uint32 a;
        uint32 b;
        uint32 c;
    }

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
    }

    /// @notice Maps hex location to token id.
    mapping(uint32 => mapping(uint32 => mapping(uint32 => uint256))) getTokenId;

    /// @notice Maps token id to their data.
    mapping(uint256 => VertexData) public getVertex;

    /// @notice Struct holding data relevant to each user's account.
    struct UserData {
        uint32 vertexesOwned;
        uint32 emissionMultiple;
        uint128 lastBalance;
        uint64 lastTimestamp;
    }

    /// @notice Maps user addresses to their account data.
    mapping(address => UserData) public getUserData;

    function ownerOf(uint32 id) external view returns (address owner) {
        require((owner = getVertex[id].owner) != address(0), "NOT_MINTED");
    }

    function isVertexValid(
        uint32 a,
        uint32 b,
        uint32 c
    ) public pure returns (bool) {
        // invalid hex coordinate (always say is minted)
        if ((a + b + c) % 3 == 0) {
            return false;
        }
        return true;
    }

    function isVertexMintable(
        uint32 a,
        uint32 b,
        uint32 c
    ) internal view returns (bool) {
        return isVertexValid(a, b, c) && (getTokenId[a][b][c] == 0);
    }

    function getNextVertex(Position memory loc)
        public
        view
        returns (Position memory pos)
    {
        //  6 possible places
        Position[6] memory validLocations;
        uint256 index = 0;
        if (isVertexMintable(loc.a + 1, loc.b, loc.c)) {
            validLocations[index] = Position(loc.a + 1, loc.b, loc.c);
            ++index;
        }
        if (isVertexMintable(loc.a - 1, loc.b, loc.c)) {
            validLocations[index] = Position(loc.a - 1, loc.b, loc.c);
            ++index;
        }
        if (isVertexMintable(loc.a, loc.b + 1, loc.c)) {
            validLocations[index] = Position(loc.a, loc.b + 1, loc.c);
            ++index;
        }
        if (isVertexMintable(loc.a, loc.b - 1, loc.c)) {
            validLocations[index] = Position(loc.a, loc.b - 1, loc.c);
            ++index;
        }
        if (isVertexMintable(loc.a, loc.b, loc.c + 1)) {
            validLocations[index] = Position(loc.a, loc.b, loc.c + 1);
            ++index;
        }
        if (isVertexMintable(loc.a, loc.b, loc.c - 1)) {
            validLocations[index] = Position(loc.a, loc.b, loc.c - 1);
            ++index;
        }
        require(index > 0);
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
        Position memory p
    ) internal {
        require(isVertexMintable(p.a, p.b, p.c)); // require that location has not been minted
        require(getVertex[id].owner == address(0)); // require that token-id as not been minted yet

        unchecked {
            ++getUserData[to].vertexesOwned;
        }

        getVertex[id].owner = to;
        getVertex[id].loc = p;
        getTokenId[p.a][p.b][p.c] = id;

        emit Transfer(address(0), to, id);
    }
}
