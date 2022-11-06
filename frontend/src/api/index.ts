import * as board from "./board";
import { AllVertexData, OptimismInterface } from "./optimismInterface";

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

  async board(): Promise<AllVertexData[]> {
    const lastId = await this.interface.getLastMintedId();
    if (lastId === 1) {
      return [];
    }
    const vertexIds: number[] = [...Array(lastId - 1)].map((_, index) => index+1);
    const vertexData = await Promise.all(vertexIds.map(async (vertexId) => {
      const vertexData = await this.interface.getVertexData(vertexId);
      const emissionMultiple = await this.interface.getVertexEmissionMultiple(vertexId);
      return {...vertexData, emissionMultiple};
    }));
    return vertexData;
  }
}

