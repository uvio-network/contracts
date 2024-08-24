import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { Index } from "./src/Index";

describe("Claims", function () {
  describe("createResolve", function () {
    describe("revert", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        return { Address, Claims, Signer, Token };
      }

      it("if owner is signer", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(0)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if voter is signer", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(1)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if staker is signer", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(2)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
