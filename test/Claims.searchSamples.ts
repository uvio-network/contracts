import { Claim } from "./src/Claim";
import { CreatePropose16Expired } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { Role } from "./src/Role";

const MAX = maxUint256;

describe("Claims", function () {
  describe("searchSamples", function () {
    describe("spotty true", function () {
      const createResolve = async () => {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          [
            0, 2, 7, // true
            MAX - BigInt(4), MAX - BigInt(3), MAX - BigInt(2), // false
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find disagreeing voters, (2^256)-1 (2^256)-1", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX, MAX)).to.deep.equal([]);
      });

      it("should find all disagreeing voters, (2^256)-100 (2^256)-1", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(100), MAX)).to.deep.equal([Address(13), Address(12), Address(11)]);
      });

      it("should keep track of all voters, 2 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([Address(1), Address(3), Address(8)]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([Address(13), Address(12), Address(11)]);
      });

      it("should keep track of true voters, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 2)).to.deep.equal([Address(1), Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 5)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 6, 8)).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), 9, 12)).to.deep.equal([]);
      });

      it("should keep track of voters, 10 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);
        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([Address(1)]);
        expect(await Claims.searchSamples(Claim(1), 1, 1)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 2, 2)).to.deep.equal([Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 3)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 4, 4)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 5, 5)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 6, 6)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 7, 7)).to.deep.equal([Address(8)]);
        expect(await Claims.searchSamples(Claim(1), 8, 8)).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), 9, 9)).to.deep.equal([]);
      });
    });

    describe("multiple calls true", function () {
      const createResolve = async () => {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          [
            0, 1, 2, 3, 4, 5, 6, 7, // true
            MAX - BigInt(7), MAX - BigInt(6), MAX - BigInt(5), MAX - BigInt(4), MAX - BigInt(3), MAX - BigInt(2), MAX - BigInt(1), MAX, // false
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should find disagreeing voter, (2^256)-1 (2^256)-1", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX, MAX)).to.deep.equal([Address(9)]);
      });

      it("should find all disagreeing voters, (2^256)-100 (2^256)-1", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(100), MAX)).to.deep.equal([
          Address(16), Address(15), Address(14), Address(13), Address(12), Address(11), Address(10), Address(9)
        ]);
      });

      it("should keep track of all voters, 2 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([
          Address(1), Address(2), Address(3), Address(4), Address(5), Address(6), Address(7), Address(8)
        ]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([
          Address(16), Address(15), Address(14), Address(13), Address(12), Address(11), Address(10), Address(9)
        ]);
      });

      it("should keep track of true voters, 4 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 2)).to.deep.equal([Address(1), Address(2), Address(3)]);
        expect(await Claims.searchSamples(Claim(1), 3, 5)).to.deep.equal([Address(4), Address(5), Address(6)]);
        expect(await Claims.searchSamples(Claim(1), 6, 8)).to.deep.equal([Address(7), Address(8)]);
        expect(await Claims.searchSamples(Claim(1), 9, 12)).to.deep.equal([]);
      });
    });

    describe("spotty false", function () {
      const createResolve = async () => {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          [
            2, 3, 4, // true
            MAX - BigInt(7), MAX - BigInt(1), MAX, // false
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should not find agreeing voter, 0 0", async function () {
        const { Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([]);
      });

      it("should find agreeing voters, 0 100", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([Address(3), Address(4), Address(5)]);
      });

      it("should keep track of all voters, 2 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([Address(3), Address(4), Address(5)]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([Address(16), Address(10), Address(9)]);
      });

      it("should keep track of false voters, 3 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(5))).to.deep.equal([Address(16)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(2))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX)).to.deep.equal([Address(10), Address(9)]);
      });

      it("should keep track of false voters, 10 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(9), MAX - BigInt(9))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(8), MAX - BigInt(8))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(7))).to.deep.equal([Address(16)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(6), MAX - BigInt(6))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(5), MAX - BigInt(5))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(4))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(3), MAX - BigInt(3))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(2), MAX - BigInt(2))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX - BigInt(1))).to.deep.equal([Address(10)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(0), MAX - BigInt(0))).to.deep.equal([Address(9)]);
      });
    });

    describe("multiple calls random", function () {
      const createResolve = async () => {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          [
            MAX - BigInt(7), // false
            MAX - BigInt(1), // false
            4,               // true
            1,               // true
            5,               // true
            MAX - BigInt(4), // false
            6,               // true
            MAX,             // false
            MAX - BigInt(6), // false
            0,               // true
            MAX - BigInt(5), // false
            MAX - BigInt(2), // false
            3,               // true
            7,               // true
            MAX - BigInt(3), // false
            2,               // true
          ],
          Expiry(7, "days"),
        );

        return { Address, Claims };
      }

      it("should find agreeing voters, 0 0", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 0)).to.deep.equal([Address(1)]);
      });

      it("should find all agreeing voters, 0 100", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([
          Address(5), Address(2), Address(6), Address(7), Address(1), Address(4), Address(8), Address(3)
        ]);
      });

      it("should keep track of all voters, 2 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        const res = await Claims.searchIndices(Claim(1));

        expect(await Claims.searchSamples(Claim(1), res[1], res[2])).to.deep.equal([
          Address(5), Address(2), Address(6), Address(7), Address(1), Address(4), Address(8), Address(3)
        ]);
        expect(await Claims.searchSamples(Claim(1), res[5], res[6])).to.deep.equal([
          Address(16), Address(10), Address(13), Address(9), Address(15), Address(14), Address(11), Address(12)
        ]);
      });

      it("should keep track of false voters, 3 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(5))).to.deep.equal([Address(16), Address(15), Address(14)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(2))).to.deep.equal([Address(13), Address(11), Address(12)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX)).to.deep.equal([Address(10), Address(9)]);
      });

      it("should keep track of false voters, 10 calls", async function () {
        const { Address, Claims } = await loadFixture(createResolve);

        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(9), MAX - BigInt(9))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(8), MAX - BigInt(8))).to.deep.equal([]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(7), MAX - BigInt(7))).to.deep.equal([Address(16)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(6), MAX - BigInt(6))).to.deep.equal([Address(15)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(5), MAX - BigInt(5))).to.deep.equal([Address(14)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(4), MAX - BigInt(4))).to.deep.equal([Address(13)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(3), MAX - BigInt(3))).to.deep.equal([Address(12)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(2), MAX - BigInt(2))).to.deep.equal([Address(11)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(1), MAX - BigInt(1))).to.deep.equal([Address(10)]);
        expect(await Claims.searchSamples(Claim(1), MAX - BigInt(0), MAX - BigInt(0))).to.deep.equal([Address(9)]);
      });
    });
  });
});
