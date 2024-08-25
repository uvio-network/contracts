import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

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

        return { Address, Claims, Signer };
      };

      it("if bot role was not granted to owner address", async function () {
        const { Claims, Signer } = await loadFixture(createPropose);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(0)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
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
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
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
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
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
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
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

      it("if indices are out of range, 5", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(5)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "EnumerableMapNonexistentKey");
      });

      it("if indices are out of range, 11", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(11), Index(4)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "EnumerableMapNonexistentKey");
      });

      it("if indices are duplicated, 0 0", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4), Index(0)], // 0 0
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, 4 4", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4), Index(4)], // 4 4
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
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if resolve already created, later", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
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
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });
    });
  });
});
