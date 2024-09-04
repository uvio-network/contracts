import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { CreatePropose7WeekExpiry } from "./src/Deploy";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { maxUint256 } from "viem";

describe("Claims", function () {
  describe("updatePropose", function () {
    describe("revert", function () {
      it("if minimum balance not available, have 5 need 10", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 5]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(5), // minimum is 10
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if minimum balance not available, have 10 need 10 want 20", async function () {
        const { Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(20), // only 10 available
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Token, "ERC20InsufficientAllowance");
      });

      it("if minimum balance not available, have 10 need 10 want max", async function () {
        const { Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          maxUint256, // only 10 available
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Token, "ERC20InsufficientAllowance");
      });

      it("if balance is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(0), // minimum is 10
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if proposer tries to stake on an expired claim", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(49, "hours")]); // 2 days and 1 hour later
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if somebody tries to stake on an expired claim", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(49, "hours")]); // 2 days and 1 hour later
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if signer 1 tries to stake within last 10% expiry threshold, 7 days", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose7WeekExpiry);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(152, "hours")]); // 6 days + 8 hours
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if somebody tries to stake within last 10% expiry threshold, 7 days", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose7WeekExpiry);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(153, "hours")]); // 6 days + 9 hours
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(5)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if signer 1 tries to stake within last 7 days expiry threshold, 3 months", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3], 100);

        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(90, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1992, "hours")]); // 83 days
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1993, "hours")]); // 83 days + 1 hour
        await network.provider.send("evm_mine");

        // By default durationMax is 7 days. Here we ensure that staking within
        // the last 7 days fails.
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });
    });
  });
});
