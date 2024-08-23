import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    it("should revert for users without funds", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      const call = Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(1724414158),
      );

      await expect(call).to.be.revertedWithCustomError(Claims, "Balance");
    });
  });
});
