import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Token", function () {
  describe("updateRestrict", function () {
    it("should initialize and modify restrict flag", async function () {
      const { Token, Signer } = await loadFixture(Deploy);

      {
        expect(await Token.restrict()).to.equal(true);
      }

      await Token.connect(Signer(0)).updateRestrict();

      {
        expect(await Token.restrict()).to.equal(false);
      }
    });
  });
});
