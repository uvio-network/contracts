import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("UVX", function () {
  describe("updateFreeze", function () {
    it("should initialize and modify freeze flag", async function () {
      const { Signer, UVX } = await loadFixture(Deploy);

      {
        expect(await UVX.freeze()).to.equal(false);
      }

      await UVX.connect(Signer(0)).updateFreeze();

      {
        expect(await UVX.freeze()).to.equal(true);
      }
    });
  });
});
