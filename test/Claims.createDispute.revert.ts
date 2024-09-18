import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256, maxUint64 } from "viem";
import { network } from "hardhat";
import { ResolveDispute20True30False } from "./src/Deploy";
import { Role } from "./src/Role";
import { Side } from "./src/Side";
import { UpdateDispute20True30False } from "./src/Deploy";
import { UpdateDisputedBalance20True30False } from "./src/Deploy";
import { UpdateResolve20True30False } from "./src/Deploy";
import { UpdateResolveMaxDispute } from "./src/Deploy";
import { UpdateResolvePunishNoVotes } from "./src/Deploy";
import { UpdateResolvePunishEqualVotes } from "./src/Deploy";

const MAX = maxUint256;

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
          "",
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
          "",
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
          "",
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
          "",
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
          "",
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
          "",
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
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if expiry is max uint64", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          maxUint64,
          "",
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
          "",
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
          "",
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
          Amount(20), // minimum in claim 1 was 10
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
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
          Amount(10), // minimum in claim 1 was 5
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if minimum balance is below double, one dispute", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolvePunishEqualVotes);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(9), // minimum in claim 1 was 5
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if minimum balance is above double, one dispute", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolvePunishEqualVotes);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(11), // minimum in claim 1 was 5
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if minimum balance is below double, two disputes", async function () {
        const { Balance, Claims, Signer } = await loadFixture(ResolveDispute20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(27, "days")]);
        await network.provider.send("evm_mine");

        await Balance([4], 50);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(14),
          Amount(39), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 27 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if minimum balance is above double, two disputes", async function () {
        const { Balance, Claims, Signer } = await loadFixture(ResolveDispute20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(27, "days")]);
        await network.provider.send("evm_mine");

        await Balance([4], 50);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(14),
          Amount(41), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 27 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if dispute ID used as propose ID", async function () {
        const { Balance, Claims, Signer } = await loadFixture(ResolveDispute20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(27, "days")]);
        await network.provider.send("evm_mine");

        await Balance([4], 50);

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(14),
          Amount(40), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 27 days above
          "",
          Claim(13), // must not be previous dispute ID
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if dispute already created, signer 4 immediately", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4, 5, 6], 40);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20), // minimum in claim 1 was 10
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        const txn = Claims.connect(Signer(4)).createDispute(
          Claim(14),
          Amount(20), // minimum in claim 1 was 5
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if dispute already created, signer 5 immediately", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4, 5, 6], 40);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20), // minimum in claim 1 was 10
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        const txn = Claims.connect(Signer(5)).createDispute(
          Claim(14),
          Amount(20), // minimum in claim 1 was 5
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if dispute already created, signer 6 later", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4, 5, 6], 40);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20), // minimum in claim 1 was 10
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(6)).createDispute(
          Claim(14),
          Amount(20), // minimum in claim 1 was 5
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if dispute ID already exists", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateDisputedBalance20True30False);

        await Balance([4, 5, 6], 40);

        const txn = Claims.connect(Signer(6)).createDispute(
          Claim(13),
          Amount(40), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 29 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if after challenge, balance already updated, immediately", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateDisputedBalance20True30False);

        await Balance([4, 5, 6], 40);

        const txn = Claims.connect(Signer(6)).createDispute(
          Claim(14),
          Amount(40), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 29 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if active dispute not resolved", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateDispute20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(15, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(13),
          [0, MAX], //           address 4 and 6
          Expiry(22, "days"), // 7 days from 15 above
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(21, "days")]);
        await network.provider.send("evm_mine");

        await Balance([4, 5, 6], 40);

        const txn = Claims.connect(Signer(6)).createDispute(
          Claim(14),
          Amount(40), // minimum in claim 1 was 20
          Side(true),
          Expiry(35, "days"), // 7 days from the 29 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if dispute limit reached", async function () {
        const { Claims, Signer } = await loadFixture(UpdateResolveMaxDispute);

        const txn = Claims.connect(Signer(1)).createDispute(
          Claim(104),
          Amount(80),
          Side(true),
          Expiry(25, "days"), // 4 days from the 21 days above
          "",
          Claim(1),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });
    });
  });
});
