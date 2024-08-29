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
  describe("searchSamples", function () {
    describe("spotty true", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(6)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(7)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(8)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [0, 2, 7],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find disagreeing stakers, (2^256)-1 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX, MAX)).to.deep.equal([]);
      });

      it("should not find disagreeing stakers, (2^256)-100 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(100), MAX)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([Address(1), Address(3), Address(8),]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 2)).to.deep.equal([Address(1), Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 5)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 6, 8)).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), 9, 12)).to.deep.equal([]);
      });

      it("should keep track of stakers, 8 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);
        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([Address(1)]);
        expect(await Claims.searchSamples(Claim(1), 1, 1)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 2, 2)).to.deep.equal([Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 3)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 4, 4)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 5, 5)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 6, 6)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 7, 7)).to.deep.equal([Address(8)]);
      });
    });

    describe("multiple calls true", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(6)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(7)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );
        await Claims.connect(Signer(8)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [0, 1, 2, 3, 4, 5, 6, 7],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find disagreeing stakers, (2^256)-1 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX, MAX)).to.deep.equal([]);
      });

      it("should not find disagreeing stakers, (2^256)-100 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(100), MAX)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([
          Address(1), Address(2), Address(3), Address(4), Address(5), Address(6), Address(7), Address(8)
        ]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 2)).to.deep.equal([Address(1), Address(2), Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 5)).to.deep.equal([Address(4), Address(5), Address(6)]);
        expect(await Claims.searchSamples(Claim(1), 6, 8)).to.deep.equal([Address(7), Address(8)]);
        expect(await Claims.searchSamples(Claim(1), 9, 12)).to.deep.equal([]);
      });
    });

    describe("spotty false", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
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
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(6)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(7)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(8)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [
            MAX - BigInt(7),
            MAX - BigInt(1),
            MAX,
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find agreeing stakers, 0 0", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([]);
      });

      it("should not find agreeing stakers, 0 100", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([Address(8), Address(2), Address(1),]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(5))).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(2))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX)).to.deep.equal([Address(2), Address(1)]);
      });

      it("should keep track of stakers, 8 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(7))).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(6), MAX - BigInt(6))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(5), MAX - BigInt(5))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(4))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(3), MAX - BigInt(3))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(2), MAX - BigInt(2))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX - BigInt(1))).to.deep.equal([Address(2)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(0), MAX - BigInt(0))).to.deep.equal([Address(1)]);
      });
    });

    describe("multiple calls false", function () {
      const createResolve = async () => {
        const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
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
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(6)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(7)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );
        await Claims.connect(Signer(8)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [
            MAX - BigInt(7),
            MAX - BigInt(6),
            MAX - BigInt(2), // 6 swapped for 3
            MAX - BigInt(4),
            MAX - BigInt(3),
            MAX - BigInt(5), // 3 swapped for 6
            MAX - BigInt(1),
            MAX,
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find agreeing stakers, 0 0", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([]);
      });

      it("should not find agreeing stakers, 0 100", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([]);
      });

      it("should keep track of stakers, 1 call", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX)).to.deep.equal([
          Address(8),
          Address(7),
          Address(3), // 6 swapped for 3
          Address(5),
          Address(4),
          Address(6), // 3 swapped for 6
          Address(2),
          Address(1),
        ]);
      });

      it("should keep track of stakers, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(5))).to.deep.equal([Address(8), Address(7), Address(6)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(2))).to.deep.equal([Address(3), Address(5), Address(4)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX)).to.deep.equal([Address(2), Address(1)]);
      });

      it("should keep track of stakers, 8 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(7))).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(6), MAX - BigInt(6))).to.deep.equal([Address(7)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(5), MAX - BigInt(5))).to.deep.equal([Address(6)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(4))).to.deep.equal([Address(5)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(3), MAX - BigInt(3))).to.deep.equal([Address(4)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(2), MAX - BigInt(2))).to.deep.equal([Address(3)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX - BigInt(1))).to.deep.equal([Address(2)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(0), MAX - BigInt(0))).to.deep.equal([Address(1)]);
      });
    });
  });
});
