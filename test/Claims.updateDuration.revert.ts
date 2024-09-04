import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("updateDuration", function () {
    describe("revert", function () {
      it("if basis is empty", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateDuration(
          0,
          60 * 60 * 24, // 1 day
          60 * 60 * 6,  // 6 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if basis is more than 5,000", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateDuration(
          5_001,        // over 50%
          60 * 60 * 24, // 1 day
          60 * 60 * 6,  // 6 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if signer 1 tries to update fees", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).updateDuration(
          2_000,        // 20%
          60 * 60 * 24, // 1 day
          60 * 60 * 6,  // 6 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if signer 3 tries to update fees", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(3)).updateDuration(
          2_000,        // 20%
          60 * 60 * 24, // 1 day
          60 * 60 * 6,  // 6 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if signer 9 tries to update fees with BOT_ROLE", async function () {
        const { Address, Claims, Signer } = await loadFixture(Deploy);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).updateDuration(
          2_000,        // 20%
          60 * 60 * 24, // 1 day
          60 * 60 * 6,  // 6 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
