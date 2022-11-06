import { contractAbi } from "./optimismContractAbi";
import { ethers, PopulatedTransaction } from 'ethers';



import { Network, Alchemy } from 'alchemy-sdk';

// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: 'demo', // Replace with your Alchemy API Key.
  network: Network.OPT_MAINNET, // Replace with your network.
};
type Hex = {
  a: number;
  b: number;
  c: number;
}
type VertexData = {
  id: number;
  owner: string;
  loc: Hex;
  lastTimestamp: ethers.BigNumber;
}

export type AllVertexData = VertexData & { emissionMultiple: ethers.BigNumber };

// hard-coded
const contractAddress = "0x1F45c359A5BBd1896775Cb29D87eb824d59d73A3";

export class OptimismInterface {
  private contract: ethers.Contract;
  constructor(providerUrlp: string | null) {
    const providerUrl = "https://opt-goerli.g.alchemy.com/v2/T0y4zfAJzll19yGU6wnbDucf2uaryuYt"
    const provider = new ethers.providers.StaticJsonRpcProvider(providerUrl);
    this.contract = new ethers.Contract(contractAddress, contractAbi, provider);
  }

  async getLastMintedId(): Promise<number> {
    const lastId: ethers.BigNumber = await this.contract.getLastMintedId();
    return lastId.toNumber();
  }

  async startMint(): Promise<ethers.PopulatedTransaction> {
    const txnData = await this.contract?.populateTransaction.startingMint(
      {
        value: 0,
      }
    );
    return txnData;
  }

  async mint(vertexId: number): Promise<ethers.PopulatedTransaction> {
    const txnData = await this.contract?.populateTransaction.mintFromResource(
      vertexId,
      {
        value: 0,
      }
    );
    return txnData;
  }
  async transfer(to: string, from: string, tokenId: ethers.BigNumber): Promise<PopulatedTransaction> {
    const txnData = await this.contract?.populateTransaction.transferFrom(from, to, tokenId);
    return txnData;
  }

  async getVertexLocation(vertexId: number): Promise<Hex> {
    const location: [number, number, number] = await this.contract.getVertexLocation(vertexId);
    return {a: location[0], b: location[1], c: location[2]};
  }

  async getVertexData(vertexId: number): Promise<VertexData> {
    const vertexData = await this.contract.getVertexData(vertexId);
    return {...vertexData, id: vertexId};
  }

  async getVertexEmissionMultiple(vertexId: number): Promise<ethers.BigNumber> {
    const emissionMultiple = await this.contract.getVertexEmissionMultiple(vertexId);
    return emissionMultiple;
  }
}
