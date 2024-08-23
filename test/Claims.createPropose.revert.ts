import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    describe("revert", function () {
      const createPropose = async () => {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );

        return { Claims, txn };
      }

      it("should revert for users without funds", async function () {
        const { Claims, txn } = await loadFixture(createPropose);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });
  });
});
