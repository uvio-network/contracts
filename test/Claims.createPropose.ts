import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    const createPropose = async () => {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
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
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(30),
        Side(true),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(3)).createPropose(
        Claim(1),
        Amount(50),
        Side(true),
        Expiry(2, "days"),
      );

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(20),
        Side(true),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        Expiry(2, "days"),
      );

      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(5),
        Side(true),
        Expiry(2, "days"),
      );

      return { Address, Claims };
    }

    const createProposeRevert = async () => {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      {
        await Balance([1, 2], [10, 50]);
      }

      {
        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(5, "hours"),
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      }

      {
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          Expiry(9, "weeks"),
        );
      }

      return { Address, Claims };
    }

    it("should create claim with lifecycle phase propose", async function () {
      const { Address, Claims } = await loadFixture(createPropose);

      expect(await Claims.searchMembers(Claim(1))).to.equal(1);
      expect(await Claims.searchStakers(Claim(1))).to.deep.equal([Address(1)]);
    });

    it("should allocate a user balance", async function () {
      const { Address, Claims } = await loadFixture(createPropose);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(Amount(10)); // allocated
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

    it("should create claim with lifecycle phase propose", async function () {
      const { Address, Claims } = await loadFixture(createProposeMulti);

      expect(await Claims.searchMembers(Claim(1))).to.equal(3);
      expect(await Claims.searchStakers(Claim(1))).to.deep.equal([Address(1), Address(2), Address(3)]);
    });

    it("if prior attempt failed", async function () {
      const { Address, Claims } = await loadFixture(createProposeRevert);

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(Amount(50)); // allocated
      expect(res[1]).to.equal(0);          // available
    });
  });
});
