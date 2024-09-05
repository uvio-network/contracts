import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Amount } from "./src/Amount";

describe("Claims", function () {
  describe("receive", function () {
    describe("revert", function () {
      it("if sending ETH to Claims contract", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Signer(0).sendTransaction({
          to: await Claims.getAddress(),
          value: Amount(1), // send 1 ETH
        });

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });
  });
});
