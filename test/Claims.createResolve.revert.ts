import { Claim } from "./src/Claim";
import { CreatePropose16 } from "./src/Deploy";
import { CreatePropose16Expired } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./src/Role";

const MAX = maxUint256;

describe("Claims", function () {
  describe("createResolve", function () {
    describe("revert", function () {
      it("if bot role was not granted to owner address", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose16Expired);

        const txn = Claims.connect(Signer(0)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to voter address", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose16Expired);


        const txn = Claims.connect(Signer(1)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to staker address", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose16Expired);

        const txn = Claims.connect(Signer(2)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if bot role was not granted to random address", async function () {
        const { Claims, Signer } = await loadFixture(CreatePropose16Expired);

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if signer not part of multiple signers, signer 8", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));
        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(8)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });

      it("if propose is empty", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(0),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if propose does not exist", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(3),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are empty", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [], // empty
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, +11", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [11, MAX],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, +47", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [47, MAX],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, -9", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [3, MAX - BigInt(9)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are out of range, -11", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX - BigInt(11)],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, 0 0", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            0,
            MAX,
            0,
            MAX - BigInt(4),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, +1 +1", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            1,
            MAX,
            1,
            MAX - BigInt(4),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, -1 -1", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            0,
            MAX - BigInt(1),
            MAX - BigInt(1),
            3,
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if indices are duplicated, -5 -5", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            2,
            MAX - BigInt(5),
            4,
            MAX - BigInt(5),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if no true voters", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            MAX - BigInt(2),
            MAX - BigInt(5),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if no false voters", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            2,
            3,
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if more true voters", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            0,
            1,
            4,
            5,
            MAX - BigInt(1),
            MAX - BigInt(3),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if more false voters", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [
            0,
            4,
            MAX - BigInt(2),
            MAX,
            MAX - BigInt(5),
          ],
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve already created, immediately", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if resolve created with short expiry", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(95, "hours"), // 3 days from above + 23 hours
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if resolve already created, later", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Mapping");
      });

      it("if propose still active", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        // Note that we are not expiring the propose in this test. We only move
        // 5 minutes forward and try to create a resolve before the propose
        // expired.
        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(5, "minutes")]);
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });
    });
  });
});
