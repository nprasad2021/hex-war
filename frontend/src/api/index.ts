import * as board from "./board";
import { VertexData, OptimismInterface } from "./optimismInterface";
import { ethers } from 'ethers';

export const api = {
  board: {
    get: board.get,
  },
};
export class apiv2 {
  private interface: OptimismInterface;
  constructor(providerUrl: string | null) {
    this.interface = new OptimismInterface(providerUrl);
  }

  async freeMint(){
    return await this.interface.startMint();
  }

  async mintFromOwnedResource(vertexId: number) {
    return await this.interface.mint(vertexId);
  }

  async transfer(to: string, from: string, tokenId: ethers.BigNumber): Promise<ethers.PopulatedTransaction> {
    return await this.interface.transfer(to, from, tokenId);
  }

  async board(): Promise<VertexData[]> {
    const lastId = await this.interface.getLastMintedId();
    if (lastId === 1) {
      return [];
    }
    const vertexIds: number[] = [...Array(lastId - 1)].map((_, index) => index+1);
    const vertexData = await Promise.all(vertexIds.map(async (vertexId) => {
      return await this.interface.getVertexData(vertexId);
      ;
    }));
    return vertexData;
  }
}

