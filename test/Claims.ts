import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  async function deploy() {
    const tok = await ethers.deployContract("Token");
    const cla = await ethers.deployContract("Claims", [await tok.getAddress()]);
    const [zer, one, two, thr, fou, fiv, six, sev] = await ethers.getSigners();

    return {
      cnt: cla,
      cla: {
        zer: BigInt(1234),
        one: BigInt(3456),
      },
      sig: {
        zer: zer,
        one: one,
        two: two,
        thr: thr,
        fou: fou,
        fiv: fiv,
        six: six,
        sev: sev,
      },
      tok: tok,
    };
  }

  describe("withdraw", function () {
    it("should revert for users without funds", async function () {
      const { cnt, sig } = await loadFixture(deploy);

      await expect(cnt.connect(sig.one).withdraw(1)).to.be.revertedWithCustomError(cnt, "Balance");
      await expect(cnt.connect(sig.two).withdraw(1)).to.be.revertedWithCustomError(cnt, "Balance");
      await expect(cnt.connect(sig.thr).withdraw(1)).to.be.revertedWithCustomError(cnt, "Balance");
    });
  });
});
