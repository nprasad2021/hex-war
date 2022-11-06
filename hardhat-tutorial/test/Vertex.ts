import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vertex", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
    const [owner, otherAccount] = await ethers.getSigners();

    const Vertex = await ethers.getContractFactory("Vertex");
    const vertex = await Vertex.attach("0x1F45c359A5BBd1896775Cb29D87eb824d59d73A3");
    });

  });

});
