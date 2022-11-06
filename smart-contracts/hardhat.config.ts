import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.0",
  defaultNetwork: 'localhost',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      allowUnlimitedContractSize: true
    },
    'optimism-goerli': {
      url: "https://goerli.optimism.io",
      accounts: ['13e5009f0b839d36647efb4495d9d3a99bbd22cf1572bf7b2d2f844eaa71a5c2']
    },
  }
};

export default config;
