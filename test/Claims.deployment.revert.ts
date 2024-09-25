import { expect } from "chai";
import { ethers } from "hardhat";
import { zeroAddress } from "viem";

describe("Claims", function () {
  describe("deployment", function () {
    describe("revert", function () {
      it("if owner address is empty", async function () {
        const Stablecoin = await ethers.deployContract("Stablecoin", [6]);
        const Claims = await ethers.getContractFactory("Claims");

        const txn = ethers.deployContract("Claims", [zeroAddress, await Stablecoin.getAddress()]);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if token contract is empty", async function () {
        const sig = await ethers.getSigners();
        const Claims = await ethers.getContractFactory("Claims");

        const txn = ethers.deployContract("Claims", [sig[0].address, zeroAddress]);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if token decimals is below 6, 5", async function () {
        const sig = await ethers.getSigners();

        const Claims = await ethers.getContractFactory("Claims");
        const Stablecoin5 = await ethers.deployContract("Stablecoin", [5]);

        const txn = ethers.deployContract("Claims", [sig[0].address, await Stablecoin5.getAddress()]);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if token decimals is below 6, 2", async function () {
        const sig = await ethers.getSigners();

        const Claims = await ethers.getContractFactory("Claims");
        const Stablecoin5 = await ethers.deployContract("Stablecoin", [2]);

        const txn = ethers.deployContract("Claims", [sig[0].address, await Stablecoin5.getAddress()]);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if token contract is not ERC20", async function () {
        const sig = await ethers.getSigners();

        const txn = ethers.deployContract("Claims", [sig[0].address, sig[1].address]);

        await expect(txn).to.be.revertedWithoutReason();
      });
    });
  });
});
