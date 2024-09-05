import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    describe("revert", function () {
      it("if users have no funds", async function () {
        const { Claims, Signer, UVX } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
      });

      it("if users have not enough funds", async function () {
        const { Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1], 5);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
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

      it("if balance is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(0),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if expiry is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
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
    });
  });
});
