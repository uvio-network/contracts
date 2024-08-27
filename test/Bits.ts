import { Claim } from "./src/Claim";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Bits", function () {
  const Deploy = async () => {
    const Bits = await ethers.deployContract("BitsTest");

    return { Bits };
  };

  it("all bits should be false at deployment", async function () {
    const { Bits } = await loadFixture(Deploy);

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });

  it("setting index 0 for claim 1 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), BigInt(0))

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(true); // set
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });

  it("setting index 5 for claim 7 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), BigInt(0))
    await Bits.set(Claim(7), BigInt(5))

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(true); // set
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });

  it("setting index 7 for claim 1 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), BigInt(0))
    await Bits.set(Claim(7), BigInt(5))
    await Bits.set(Claim(1), BigInt(7))

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(true); // set
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(true);
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });

  it("setting index 8 for claim 7 should not set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), BigInt(0))
    await Bits.set(Claim(7), BigInt(5))
    await Bits.set(Claim(1), BigInt(7))
    await Bits.set(Claim(7), BigInt(8))

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(true);
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false); // overflow
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });

  it("setting index 9 for claim 1 should not set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), BigInt(0))
    await Bits.set(Claim(7), BigInt(5))
    await Bits.set(Claim(1), BigInt(7))
    await Bits.set(Claim(7), BigInt(8))
    await Bits.set(Claim(1), BigInt(9))

    {
      expect(await Bits.get(Claim(1), BigInt(0))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(5))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(7))).to.equal(true);
      expect(await Bits.get(Claim(1), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(1), BigInt(9))).to.equal(false); // overflow
    }

    {
      expect(await Bits.get(Claim(7), BigInt(0))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(1))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(2))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(3))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(4))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(5))).to.equal(true);
      expect(await Bits.get(Claim(7), BigInt(6))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(7))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(8))).to.equal(false);
      expect(await Bits.get(Claim(7), BigInt(9))).to.equal(false);
    }
  });
});
