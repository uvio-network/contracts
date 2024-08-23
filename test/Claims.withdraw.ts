import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("withdraw", function () {
    it("should revert for users without funds", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      await expect(Claims.connect(Signer(1)).withdraw(1)).to.be.revertedWithCustomError(Claims, "Balance");
      await expect(Claims.connect(Signer(2)).withdraw(1)).to.be.revertedWithCustomError(Claims, "Balance");
      await expect(Claims.connect(Signer(3)).withdraw(1)).to.be.revertedWithCustomError(Claims, "Balance");
    });
  });
});
