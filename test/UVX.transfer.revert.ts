import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("transfer", function () {
    describe("revert", function () {
      it("if signer 0 tries to transfer to signer 5", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await Balance([0], 10);

        const txn = UVX.connect(Signer(0)).transfer(Address(5), Amount(10));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if signer 1 tries to transfer to signer 2", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = UVX.connect(Signer(1)).transfer(Address(2), Amount(10));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if signer 0 tries to transferFrom to signer 5", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await Balance([0], 10);

        const txn = UVX.connect(Signer(0)).transferFrom(Address(0), Address(5), Amount(10));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if signer 1 tries to transferFrom to signer 2", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = UVX.connect(Signer(1)).transferFrom(Address(1), Address(2), Amount(10));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
