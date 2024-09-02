import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { UpdateResolve20True30False } from "./src/Deploy";
import { UpdateResolvePunishNoVotes } from "./src/Deploy";
import { UpdateResolvePunishEqualVotes } from "./src/Deploy";

describe("Claims", function () {
  describe("createDispute", function () {
    describe("revert", function () {
      it("if dispute empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(0),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if propose empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(0),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if propose not exist", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(201),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if minimum balance not available", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(19),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if balance is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(0),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if expiry is shorter than 3 days", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(11, "days"), // 3 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if expiry is longer than 30 days", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(913, "hours"), // 30 days + 1 hour from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if resolve of disputed propose is not yet expired", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(167, "hours")]); // -1 hour from the 7 days before
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if resolve of disputed propose is outside challenge window", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days after resolve expiry
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if resolve has no votes", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolvePunishNoVotes);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if resolve has equal votes", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolvePunishEqualVotes);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });
    });
  });
});
