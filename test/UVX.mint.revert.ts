import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("mint", function () {
    describe("revert", function () {
      it("if signer 1 tries to mint for themselves", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(1)).mint(Address(1), Amount(100));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if signer 1 tries to mint for signer 5", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(1)).mint(Address(5), Amount(100));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
