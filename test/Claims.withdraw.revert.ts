import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("withdraw", function () {
    describe("revert", function () {
      it("if users have no funds", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });
  });
});
