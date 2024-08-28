import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    describe("revert", function () {
      it("if users have no funds", async function () {
        const { Claims, Signer, Token } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Token, "ERC20InsufficientAllowance");
      });

      it("if users have not enough funds", async function () {
        const { Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1], 5);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Token, "ERC20InsufficientAllowance");
      });

      it("if propose is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(0),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if expiry is 5 hours", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(5, "hours"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if expiry is 23 hours", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(23, "hours"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if minimum balance not available", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 5]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        const txn = Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(5), // minimum is 10
          Side(true),
          Expiry(2, "days"),
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

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          BigInt(0),
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

        const txn = Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          BigInt(0),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });
    });
  });
});
