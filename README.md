# Hex-War
Conquer a virtual world. 

## Mechanics
The game world is represented as a hexagonal grid.
Every vertex in the hexagonal grid is represented by a NFT implementing the ERC-721 interface (VertexERC721.sol).
Moreover, while every NFT has a unique tokenId, every NFT is also uniquely represented by a set of three coordinates, corresponding to a position in space.

NFT holders are able to mint new NFTs only in hex locations directly adjacent to an NFT they currently own. However users are not able to continously mint - a randomized cooldown period prevents constant expansion.

Controlling a hex is valuable. The more NFTs someone owns that are located on the same hex, the lower cooldown periods exist for minting new NFTs.
However, 
