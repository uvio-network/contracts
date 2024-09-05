import { expect } from "chai";
import { ethers } from "hardhat";
import { zeroAddress } from "viem";

describe("UVX", function () {
  describe("deployment", function () {
    describe("revert", function () {
      it("if owner address is empty", async function () {
        const Stablecoin = await ethers.deployContract("Stablecoin");
        const UVX = await ethers.getContractFactory("UVX");

        const txn = ethers.deployContract("UVX", [zeroAddress, await Stablecoin.getAddress()]);

        await expect(txn).to.be.revertedWithCustomError(UVX, "Address");
      });

      it("if token contract is empty", async function () {
        const sig = await ethers.getSigners();
        const UVX = await ethers.getContractFactory("UVX");

        const txn = ethers.deployContract("UVX", [sig[0].address, zeroAddress]);

        await expect(txn).to.be.revertedWithCustomError(UVX, "Address");
      });

      it("if token contract is not ERC20", async function () {
        const sig = await ethers.getSigners();

        const txn = ethers.deployContract("UVX", [sig[0].address, sig[1].address]);

        await expect(txn).to.be.revertedWithoutReason();
      });
    });
  });
});
