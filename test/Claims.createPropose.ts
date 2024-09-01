import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { CreatePropose7WeekExpiry } from "./src/Deploy";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

const EXPIRY = Expiry(2, "days");

describe("Claims", function () {
  describe("createPropose", function () {
    const createPropose = async () => {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        EXPIRY,
      );

      return { Address, Claims };
    }

    const createProposeMulti = async () => {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1, 2, 3], 50);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        EXPIRY,
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(30),
        Side(true),
        0,
      );
      await Claims.connect(Signer(3)).createPropose(
        Claim(1),
        Amount(50),
        Side(true),
        0,
      );

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(20),
        Side(true),
        0,
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        0,
      );

      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        0,
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        0,
      );

      return { Address, Claims };
    }

    it("with 25 hour expiry", async function () {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([2], 10);

      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(25, "hours"),
      );

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(10)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("if prior attempt by signer 1 failed", async function () {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1, 2], [10, 50]);

      const txn = Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(5, "hours"),
      );

      await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");

      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(50),
        Side(true),
        EXPIRY,
      );

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(50)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("if prior attempt by signer 2 failed", async function () {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1, 2], [10, 50]);

      const txn = Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(5, "hours"),
      );

      await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");

      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(30),
        Side(true),
        EXPIRY,
      );

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(30)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("should allocate a user balance", async function () {
      const { Address, Claims } = await loadFixture(createPropose);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(Amount(10)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("allow signer 1 to stake up until expiry", async function () {
      const { Address, Claims } = await loadFixture(CreatePropose7WeekExpiry);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(Amount(50)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("allow signer 2 to stake up until expiry", async function () {
      const { Address, Claims } = await loadFixture(CreatePropose7WeekExpiry);

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(30)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("allow signer 3 to stake up until expiry", async function () {
      const { Address, Claims } = await loadFixture(CreatePropose7WeekExpiry);

      const res = await Claims.searchBalance(Address(3));

      expect(res[0]).to.equal(Amount(30)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("should calculate balances accurately for signer 1", async function () {
      const { Address, Claims } = await loadFixture(createProposeMulti);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(Amount(25)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("should calculate balances accurately for signer 2", async function () {
      const { Address, Claims } = await loadFixture(createProposeMulti);

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(45)); // allocated
      expect(res[1]).to.equal(0);          // available
    });

    it("should calculate balances accurately for signer 3", async function () {
      const { Address, Claims } = await loadFixture(createProposeMulti);

      const res = await Claims.searchBalance(Address(3));

      expect(res[0]).to.equal(Amount(50)); // allocated
      expect(res[1]).to.equal(0);          // available
    });
  });
});
