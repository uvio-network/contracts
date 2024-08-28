import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;

describe("Claims", function () {
  describe("updateResolve", function () {
    describe("revert", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
        );

        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        return { Address, Balance, Claims, Signer, Token };
      }

      it("if owner tries to stake reputation", async function () {
        const { Balance, Claims, Signer } = await loadFixture(createResolve);

        await Balance([0], 10);

        const txn = Claims.connect(Signer(0)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if voter tries to stake reputation", async function () {
        const { Balance, Claims, Signer } = await loadFixture(createResolve);

        await Balance([5], 10);

        const txn = Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if owner tries to verify the truth with true", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(0)).updateResolve(
          Claim(1),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if owner tries to verify the truth with false", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(0)).updateResolve(
          Claim(1),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if staker tries to verify the truth with true", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(2)).updateResolve(
          Claim(1),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if staker tries to verify the truth with false", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(2)).updateResolve(
          Claim(1),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if signer 1 tries to verify the truth twice, true true", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if signer 1 tries to verify the truth twice, false true", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(false),
        );

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if signer 1 tries to verify the truth twice, true false", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if signer 1 tries to verify the truth twice, false false", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(false),
        );

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Address");
      });

      it("if signer 1 tries to verify the truth with true after expiry", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if signer 1 tries to verify the truth with false after expiry", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if signer 1 uses the wrong claim ID", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(0),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if signer 1 uses the resolve ID", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(1)).updateResolve(
          Claim(7),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if signer 3 uses the wrong claim ID", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(3)).updateResolve(
          Claim(2),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if signer 5 uses the wrong claim ID", async function () {
        const { Claims, Signer } = await loadFixture(createResolve);

        const txn = Claims.connect(Signer(5)).updateResolve(
          Claim(2),
          Side(false),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });
    });
  });
});
