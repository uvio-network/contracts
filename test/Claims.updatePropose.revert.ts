import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { CreatePropose7WeekExpiry } from "./src/Deploy";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { maxUint256 } from "viem";

describe("Claims", function () {
  describe("updatePropose", function () {
    describe("revert", function () {
      const createProposeWithWhitelist = async () => {
        const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

        const Stablecoin6 = await ethers.deployContract("Stablecoin", [6]);
        const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);
        const Stablecoin30 = await ethers.deployContract("Stablecoin", [30]);

        const ad6 = await Stablecoin6.getAddress();
        const a18 = await Stablecoin18.getAddress();
        const a30 = await Stablecoin30.getAddress();

        await Balance([1, 2, 3], 40);

        // proposer can create
        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          "",
          [ad6, a18, a30],
        );

        return { Address, Balance, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      it("if minimum balance not available, have 5 need 10", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 5]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          "",
          [],
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(5), // minimum is 10
          Side(true),
          0,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if minimum balance not available, have 10 need 10 want 20", async function () {
        const { Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          "",
          [],
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(20), // only 10 available
          Side(true),
          0,
        );

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
      });

      it("if minimum balance not available, have 10 need 10 want max", async function () {
        const { Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          "",
          [],
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          maxUint256, // only 10 available
          Side(true),
          0,
        );

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
      });

      it("if balance is empty", async function () {
        const { Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2], [10, 10]);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          "",
          [],
        );

        const txn = Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(0), // minimum is 10
          Side(true),
          0,
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
          "",
          [],
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(49, "hours")]); // 2 days and 1 hour later
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0
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
          "",
          [],
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(49, "hours")]); // 2 days and 1 hour later
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
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
          0,
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
          0,
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
          "",
          [],
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1991, "hours")]); // 82 days + 23 hours
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(1993, "hours")]); // 83 days + 1 hour
        await network.provider.send("evm_mine");

        // By default durationMax is 7 days. Here we ensure that staking within
        // the last 7 days fails.
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if proposer tries to stake without whitelisted tokens, index 0", async function () {
        const { Claims, Signer } = await loadFixture(createProposeWithWhitelist);

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0, // address 1 does not own any Stablecoin6
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if proposer tries to stake without whitelisted tokens, index 1", async function () {
        const { Claims, Signer } = await loadFixture(createProposeWithWhitelist);

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          1, // address 1 does not own any Stablecoin18
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if proposer tries to stake without whitelisted tokens, index 2", async function () {
        const { Claims, Signer } = await loadFixture(createProposeWithWhitelist);

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          2, // address 1 does not own any Stablecoin30
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if proposer tries to stake without whitelisted tokens, index 3", async function () {
        const { Claims, Signer } = await loadFixture(createProposeWithWhitelist);

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          3, // index 3 is out of range
        );

        await expect(txn).to.be.revertedWithPanic(0x32); // Array accessed at an out-of-bounds or negative index
      });

      it("if proposer tries to stake without whitelisted tokens, index 0, Stablecoin30", async function () {
        const { Address, Claims, Signer, Stablecoin30 } = await loadFixture(createProposeWithWhitelist);

        {
          await Stablecoin30.connect(Signer(0)).mint(Address(1), Amount(100, 30));
          expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(100, 30)); // address 1 owns Stablecoin30
        }

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0, // address 1 does not own any Stablecoin6
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if proposer tries to stake without whitelisted tokens, index 2, Stablecoin6 and Stablecoin18", async function () {
        const { Address, Claims, Signer, Stablecoin6, Stablecoin18 } = await loadFixture(createProposeWithWhitelist);

        {
          await Stablecoin6.connect(Signer(0)).mint(Address(1), Amount(100, 6));
          expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(100, 6)); // address 1 owns Stablecoin6
        }

        {
          await Stablecoin18.connect(Signer(0)).mint(Address(1), Amount(100, 18));
          expect(await Stablecoin18.balanceOf(Address(1))).to.equal(Amount(100, 18)); // address 1 owns Stablecoin18
        }

        // proposer cannot stake
        const txn = Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          2, // address 1 does not own any Stablecoin30
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });
  });
});
