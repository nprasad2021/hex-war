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
export type VertexData = {
  id: number;
  owner: string;
  loc: Hex;
  lastTimestamp: ethers.BigNumber;
}


// hard-coded
const contractAddress = "0x1F45c359A5BBd1896775Cb29D87eb824d59d73A3";
const alchemy = "https://opt-goerli.g.alchemy.com/v2/T0y4zfAJzll19yGU6wnbDucf2uaryuYt";
const providers: string[] = [];
providers.push(alchemy);
providers.push('https://optimism-goerli.infura.io/v3/ef1c181eff004c08832fc05f31538300');
providers.push('https://goerli.optimism.io');
//const INFURA_PREFIX = "https://optimism-mainnet.infura.io/v3";
//providers.push(INFURA_PREFIX + "/e15ef59edf294e02aaad54c2640b69ab");
//providers.push(INFURA_PREFIX + "/af1b1f1a475f450685bd7fa68a1ac9b7");
//providers.push(INFURA_PREFIX+  "/b45a89b414ed40309e6cc6a76d1277d4");
//providers.push(INFURA_PREFIX + "/2dfead1aeb5c46cf9920257da3498910");
//providers.push(INFURA_PREFIX + "/abf11636bbfb45b681777448c378a737");
//providers.push(INFURA_PREFIX + "/ea6ca3c04a274a83b73a2f38cdceddfa");

export class OptimismInterface {
  private contracts: ethers.Contract[];
  private index: number;
  constructor(providerUrlp: string | null) {
    const providerObjects = providers.map((p) => new ethers.providers.StaticJsonRpcProvider(p));
    this.contracts = providerObjects.map((provider) => new ethers.Contract(contractAddress, contractAbi, provider));
    this.index = 0;
  }

  getContract(): ethers.Contract {
    this.index  = (this.index + 1) % this.contracts.length;
    return this.contracts[this.index];
  }

  async getLastMintedId(): Promise<number> {
    const lastId: ethers.BigNumber = await this.getContract().getLastMintedId();
    return lastId.toNumber();
  }

  async startMint(): Promise<ethers.PopulatedTransaction> {
    const txnData = await this.getContract()?.populateTransaction.startingMint(
      {
        value: 0,
      }
    );
    return txnData;
  }

  async mint(vertexId: number): Promise<ethers.PopulatedTransaction> {
    const txnData = await this.getContract()?.populateTransaction.mintFromResource(
      vertexId,
      {
        value: 0,
      }
    );
    return txnData;
  }
  async transfer(to: string, from: string, tokenId: ethers.BigNumber): Promise<PopulatedTransaction> {
    const txnData = await this.getContract()?.populateTransaction.transferFrom(from, to, tokenId);
    return txnData;
  }

  async getVertexLocation(vertexId: number): Promise<Hex> {
    const location: [number, number, number] = await this.getContract().getVertexLocation(vertexId);
    return {a: location[0], b: location[1], c: location[2]};
  }

  async getVertexData(vertexId: number): Promise<VertexData> {
    const vertexData = await this.getContract().getVertexData(vertexId);
    return {...vertexData, id: vertexId};
  }

  async getVertexEmissionMultiple(vertexId: number): Promise<ethers.BigNumber> {
    const emissionMultiple = await this.getContract().getVertexEmissionMultiple(vertexId);
    return emissionMultiple;
  }
}
