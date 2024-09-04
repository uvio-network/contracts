import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("updateDuration", function () {
    it("should have set default durations", async function () {
      const { Claims } = await loadFixture(Deploy);

      const bas = await Claims.durationBasis();
      const max = await Claims.durationMax();
      const min = await Claims.durationMin();

      expect(bas).to.equal(1_000);            // 10%
      expect(max).to.equal(60 * 60 * 24 * 7); // 7 days
      expect(min).to.equal(60 * 60 * 3);      // 3 hours
    });

    it("should modify default durations", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      await Claims.connect(Signer(0)).updateDuration(
        2_000,        // 20%
        60 * 60 * 24, // 1 day
        60 * 60 * 6,  // 6 hours
      );

      const bas = await Claims.durationBasis();
      const max = await Claims.durationMax();
      const min = await Claims.durationMin();

      expect(bas).to.equal(2_000);
      expect(max).to.equal(60 * 60 * 24);
      expect(min).to.equal(60 * 60 * 6);
    });
  });
});
