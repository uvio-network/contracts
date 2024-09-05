import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Amount } from "./src/Amount";

describe("UVX", function () {
  describe("receive", function () {
    describe("revert", function () {
      it("if sending ETH to UVX contract", async function () {
        const { UVX, Signer } = await loadFixture(Deploy);

        const txn = Signer(0).sendTransaction({
          to: await UVX.getAddress(),
          value: Amount(1), // send 1 ETH
        });

        await expect(txn).to.be.revertedWithCustomError(UVX, "Balance");
      });
    });
  });
});
