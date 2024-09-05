import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Token", function () {
  describe("updateRestricted", function () {
    it("should initialize and modify restricted flag", async function () {
      const { Token, Signer } = await loadFixture(Deploy);

      {
        expect(await Token.restricted()).to.equal(true);
      }

      await Token.connect(Signer(0)).updateRestricted();

      {
        expect(await Token.restricted()).to.equal(false);
      }
    });
  });
});
