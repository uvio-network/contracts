import { Claim } from "./src/Claim";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Bits", function () {
  const Deploy = async () => {
    const Bits = await ethers.deployContract("BitsTest");

    return { Bits };
  };

  it("all bits should be false at deployment", async function () {
    const { Bits } = await loadFixture(Deploy);

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });

  it("setting index 0 for claim 1 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), Index(0))

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(true); // set
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });

  it("setting index 5 for claim 7 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), Index(0))
    await Bits.set(Claim(7), Index(5))

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(true); // set
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });

  it("setting index 7 for claim 1 should only set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), Index(0))
    await Bits.set(Claim(7), Index(5))
    await Bits.set(Claim(1), Index(7))

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(true); // set
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(true);
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });

  it("setting index 8 for claim 7 should not set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), Index(0))
    await Bits.set(Claim(7), Index(5))
    await Bits.set(Claim(1), Index(7))
    await Bits.set(Claim(7), Index(8))

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false);
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(true);
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false); // overflow
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });

  it("setting index 9 for claim 1 should not set this bit", async function () {
    const { Bits } = await loadFixture(Deploy);

    await Bits.set(Claim(1), Index(0))
    await Bits.set(Claim(7), Index(5))
    await Bits.set(Claim(1), Index(7))
    await Bits.set(Claim(7), Index(8))
    await Bits.set(Claim(1), Index(9))

    {
      expect(await Bits.get(Claim(1), Index(0))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(5))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(7))).to.equal(true);
      expect(await Bits.get(Claim(1), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(1), Index(9))).to.equal(false); // overflow
    }

    {
      expect(await Bits.get(Claim(7), Index(0))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(1))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(2))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(3))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(4))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(5))).to.equal(true);
      expect(await Bits.get(Claim(7), Index(6))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(7))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(8))).to.equal(false);
      expect(await Bits.get(Claim(7), Index(9))).to.equal(false);
    }
  });
});
