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
  describe("createResolve", function () {
    describe("revert", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

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

        return { Address, Claims, Signer };
      };

      it("if bot role was not granted to owner address", async function () {
        const { Claims, Signer } = await loadFixture(createPropose);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(0)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to voter address", async function () {
        const { Claims, Signer } = await loadFixture(createPropose);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to staker address", async function () {
        const { Claims, Signer } = await loadFixture(createPropose);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(2)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to random address", async function () {
        const { Claims, Signer } = await loadFixture(createPropose);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if propose is empty", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(0),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve is empty", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(0),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve equals propose", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(1),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if propose does not exist", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(3),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are empty", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [], // empty
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, +5", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [5, MAX],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, -7", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [MAX - BigInt(7), MAX],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, -11", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX - BigInt(11)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, +1 +1", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [1, 1, MAX],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, -1 -1", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX - BigInt(1), MAX - BigInt(1)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve already created, immediately", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve already created, later", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if propose still active", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        // Note that we are not expiring the propose in this test. We only move
        // 5 minutes forward and try to create a resolve before the propose
        // expired.
        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(5, "minutes")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });
    });
  });
});
