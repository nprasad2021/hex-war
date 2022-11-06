import { ethers } from "hardhat";
import { getContractAddress }  from '@ethersproject/address';

async function main() {
  const [owner] = await ethers.getSigners()

  const transactionCount = await owner.getTransactionCount()

  const futureAddress = getContractAddress({
    from: owner.address,
    nonce: transactionCount
  })
  console.log(futureAddress);

  const Vertex = await ethers.getContractFactory("Vertex");
  const vertex = await Vertex.deploy();

  await vertex.deployed();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
