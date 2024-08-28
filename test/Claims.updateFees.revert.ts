import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("updateFees", function () {
    describe("revert", function () {
      it("if basis is less than 5,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(4_999, 2500, 2501);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if basis makes total less than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_499, 0, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if basis makes total more than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_501, 0, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if proposer makes total less than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_000, 499, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if proposer makes total more than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_000, 501, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if protocol makes total less than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_500, 0, 499);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if protocol makes total more than 10,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateFees(9_500, 0, 501);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if signer 1 tries to update fees", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).updateFees(9_500, 0, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if signer 3 tries to update fees", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(3)).updateFees(9_500, 0, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if signer 9 tries to update fees with BOT_ROLE", async function () {
        const { Address, Claims, Signer } = await loadFixture(Deploy);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));
        const txn = Claims.connect(Signer(9)).updateFees(9_500, 0, 500);

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
