import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { Side } from "./src/Side";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;
const MID = maxUint256 / BigInt(2);

describe("Claims", function () {
  describe("searchStakers", function () {
    describe("single true", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          EXPIRY,
          "",
          [],
        );

        return { Address, Claims };
      }

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([1, 0, 0, MID, MID, MAX, MAX, 0]);
      });

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[3], res[4])).to.deep.equal([Address(1)]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[1], res[2])).to.deep.equal([Address(1)]);
        expect(await Claims.searchStakers(Claim(1), res[5], res[6])).to.deep.equal([]);
      });
    });

    describe("single false", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([3], 10);

        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          EXPIRY,
          "",
          [],
        );

        return { Address, Claims };
      }

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([0, 0, 0, MID, MID, MAX, MAX, 1]);
      });

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[3], res[4])).to.deep.equal([Address(3)]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[1], res[2])).to.deep.equal([]);
        expect(await Claims.searchStakers(Claim(1), res[5], res[6])).to.deep.equal([Address(3)]);
      });
    });

    describe("many at once", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5], 50);

        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(5),
          Side(true),
          EXPIRY,
          "",
          [],
        );
        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(5),
          Side(true),
          0,
        );
        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(20),
          Side(true),
          0,
        );

        // Signer 2 plays both sides but got registered first with true
        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );
        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );
        await Claims.connect(Signer(4)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(5)).updatePropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );

        return { Address, Claims };
      }

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([3, 0, 2, MID, MID, MAX - BigInt(1), MAX, 2]);
      });

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[3], res[4])).to.deep.equal([Address(2)]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[1], res[2])).to.deep.equal([Address(2), Address(3), Address(1)]);
        expect(await Claims.searchStakers(Claim(1), res[5], res[6])).to.deep.equal([Address(5), Address(4)]); // reversed order
      });
    });

    describe("multiple calls true", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          EXPIRY,
          "",
          [],
        );
        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(4)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(5)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(6)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(7)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(8)).updatePropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );

        return { Address, Claims };
      }

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([8, 0, 7, MID, MID, MAX, MAX, 0]);
      });

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[3], res[4])).to.deep.equal([Address(1)]);
      });

      it("should not find disagreeing voters, (2^256)-1 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchVoters(Claim(1), MAX, MAX)).to.deep.equal([]);
      });

      it("should not find disagreeing voters, (2^256)-100 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchVoters(Claim(1), MAX - BigInt(100), MAX)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), 0, 100)).to.deep.equal([
          Address(1), Address(2), Address(3), Address(4), Address(5), Address(6), Address(7), Address(8)
        ]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), MAX - BigInt(7), MAX)).to.deep.equal([]);

        expect(await Claims.searchStakers(Claim(1), 0, 2)).to.deep.equal([Address(1), Address(2), Address(3)]);
        expect(await Claims.searchStakers(Claim(1), 3, 5)).to.deep.equal([Address(4), Address(5), Address(6)]);
        expect(await Claims.searchStakers(Claim(1), 6, 8)).to.deep.equal([Address(7), Address(8)]);
        expect(await Claims.searchStakers(Claim(1), 9, 12)).to.deep.equal([]);
      });
    });

    describe("multiple calls false", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          EXPIRY,
          "",
          [],
        );
        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(4)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(5)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(6)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(7)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(8)).updatePropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );

        return { Address, Claims };
      }

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([0, 0, 0, MID, MID, MAX - BigInt(7), MAX, 8]);
      });

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[3], res[4])).to.deep.equal([Address(1)]);
      });

      it("should not find agreeing voters, 0 0", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchVoters(Claim(1), 0, 0)).to.deep.equal([]);
      });

      it("should not find agreeing voters, 0 100", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchVoters(Claim(1), 0, 100)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), MAX - BigInt(7), MAX)).to.deep.equal([
          Address(8), Address(7), Address(6), Address(5), Address(4), Address(3), Address(2), Address(1)
        ]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), 0, 7)).to.deep.equal([]);

        expect(await Claims.searchStakers(Claim(1), MAX - BigInt(7), MAX - BigInt(5))).to.deep.equal([Address(8), Address(7), Address(6)]);
        expect(await Claims.searchStakers(Claim(1), MAX - BigInt(4), MAX - BigInt(2))).to.deep.equal([Address(5), Address(4), Address(3)]);
        expect(await Claims.searchStakers(Claim(1), MAX - BigInt(1), MAX)).to.deep.equal([Address(2), Address(1)]);
      });
    });
  });
});
