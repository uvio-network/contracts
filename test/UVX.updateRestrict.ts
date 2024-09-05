import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("UVX", function () {
  describe("updateRestrict", function () {
    it("should initialize and modify restrict flag", async function () {
      const { UVX, Signer } = await loadFixture(Deploy);

      {
        expect(await UVX.restrict()).to.equal(true);
      }

      await UVX.connect(Signer(0)).updateRestrict();

      {
        expect(await UVX.restrict()).to.equal(false);
      }
    });
  });
});
