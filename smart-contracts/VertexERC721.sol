// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

/// @notice ERC721 implementation forked from ArtGobblers
abstract contract VertexERC721 {
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Transfer(address indexed from, address indexed to, uint256 indexed id);

    event Approval(address indexed owner, address indexed spender, uint256 indexed id);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /*//////////////////////////////////////////////////////////////
                         METADATA STORAGE/LOGIC
    //////////////////////////////////////////////////////////////*/

    string public name;

    string public symbol;

    function tokenURI(uint256 id) external view virtual returns (string memory);

    /*//////////////////////////////////////////////////////////////
                         VERTEX/ERC721 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Struct holding vertex data.
    struct VertexData {
        // token id
        uint64 id;
        // The current owner of the vertex.
        address owner;
        // hex coordinates.
        uint32 a;
        uint32 b;
        uint32 c;
        // Multiple --> # of vertexes surrounding gobblers..
        uint32 emissionMultiple;
    }

    /// @notice Maps hex location to token id.
    mapping(uint32 => mapping(uint32 => mapping(uint32 => uint64))) getTokenId;

    /// @notice Maps token id to their data.
    mapping(uint64 => VertexData) getVertex;

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

    function isVertexMinted(
        uint32 a,
        uint32 b,
        uint32 c
    ) external view returns (bool) {
        if (getTokenId[a] == 0) {
            return false;
        }
        if (getTokenId[a][b] == 0) {
            return false;
        }
        if (getTokenId[a][b][c] == 0) {
            return false;
        }
        return true;
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
        address owner = getTokenId[id].owner;

        require(msg.sender == owner || isApprovedForAll[owner][msg.sender], "NOT_AUTHORIZED");

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

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
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
        uint32 a,
        uint32 b,
        uint32 c
    ) internal {
        unchecked {
            ++getUserData[to].vertexesOwned;
        }
        require(isVertexMinted(a, b, c) == false);

        getTokenId[id].owner = to;
        getTokenId[id].a = a;
        getTokenId[id].b = b;
        getTokenId[id].c = c;
        getVertex[a][b][c] = id;

        emit Transfer(address(0), to, id);
    }
}
