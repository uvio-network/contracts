import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { Side } from "./src/Side";
import { zeroAddress } from "viem";
import { Index } from "./src/Index";

const EXPIRY = Expiry(2, "days");

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
        );

        return { Address, Claims };
      }

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), 0, 0)).to.deep.equal([Address(1)]);
      });

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([1, 1, maxUint256, maxUint256]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[0], res[1])).to.deep.equal([Address(1)]);
        expect(await Claims.searchStakers(Claim(1), res[2], res[3])).to.deep.equal([zeroAddress]);
      });
    });

    describe("single false", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          EXPIRY,
        );

        return { Address, Claims };
      }

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), 0, 0)).to.deep.equal([Address(1)]);
      });

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([BigInt(0), BigInt(0), Index(-1), Index(-1)]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[2], res[3])).to.deep.equal([Address(1)]);
      });
    });

    describe("multi", function () {
      const createPropose = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5], 50);

        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(5),
          Side(true),
          EXPIRY,
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(5),
          Side(true),
          0,
        );
        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(20),
          Side(true),
          0,
        );

        // Signer 2 plays both sides but got registered first with true
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(5),
          Side(false),
          0,
        );

        return { Address, Claims };
      }

      it("should keep track of proposer", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        expect(await Claims.searchStakers(Claim(1), 0, 0)).to.deep.equal([Address(2)]);
      });

      it("should keep track of indices", async function () {
        const { Claims } = await loadFixture(createPropose);

        expect(await Claims.searchIndices(Claim(1))).to.deep.equal([Index(+1), Index(+3), Index(-2), Index(-1)]);
      });

      it("should keep track of stakers", async function () {
        const { Address, Claims } = await loadFixture(createPropose);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchStakers(Claim(1), res[0], res[1])).to.deep.equal([Address(2), Address(3), Address(1)]);
        expect(await Claims.searchStakers(Claim(1), res[2], res[3])).to.deep.equal([Address(5), Address(4)]); // reversed order
      });
    });
  });
});
