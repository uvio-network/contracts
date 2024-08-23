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
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if users have not enough funds", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(Deploy);

        await Token.mint(Address(1), Amount(5));
        await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(5));

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if expiry is not at least 1 day in the future", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(Deploy);

        await Token.mint(Address(1), Amount(10));
        await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(10));

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(5, "hours"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if minimum balance not available", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(Deploy);

        {
          await Token.mint(Address(1), Amount(10));
          await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(10));

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            Expiry(2, "days"),
          );
        }

        {
          await Token.mint(Address(1), Amount(5));
          await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(5));

          const txn = Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(5),
            Side(true),
            Expiry(2, "days"),
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
        }
      });

      it("if claim already expired", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(Deploy);

        {
          await Token.mint(Address(1), Amount(10));
          await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(10));

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            Expiry(2, "days"),
          );
        }

        {
          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");
        }

        {
          await Token.mint(Address(1), Amount(10));
          await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(10));

          const txn = Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            BigInt(0),
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }
      });
    });
  });
});
