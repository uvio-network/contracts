import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("deductFees", function () {
    it("should return 45 when given 50", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.deductFees(50)).to.equal(45);
    });
  });
});
