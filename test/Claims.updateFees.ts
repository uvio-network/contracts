import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("updateFees", function () {
    it("should have set protocol fees by default", async function () {
      const { Claims } = await loadFixture(Deploy);

      const fee = await Claims.basisFee();
      const psr = await Claims.basisProposer();
      const ptc = await Claims.basisProtocol();

      expect(fee).to.equal(9_000);
      expect(psr).to.equal(500);
      expect(ptc).to.equal(500);

      expect(fee + psr + ptc).to.equal(10_000);
    });

    it("should set proposer fees to zero", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      await Claims.connect(Signer(0)).updateFees(9_500, 0, 500);

      const fee = await Claims.basisFee();
      const psr = await Claims.basisProposer();
      const ptc = await Claims.basisProtocol();

      expect(fee).to.equal(9_500);
      expect(psr).to.equal(0);
      expect(ptc).to.equal(500);

      expect(fee + psr + ptc).to.equal(10_000);
    });

    it("should set protocol fees to zero", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      await Claims.connect(Signer(0)).updateFees(9_500, 500, 0);

      const fee = await Claims.basisFee();
      const psr = await Claims.basisProposer();
      const ptc = await Claims.basisProtocol();

      expect(fee).to.equal(9_500);
      expect(psr).to.equal(500);
      expect(ptc).to.equal(0);

      expect(fee + psr + ptc).to.equal(10_000);
    });

    it("should set basis fee to 5,000", async function () {
      const { Claims, Signer } = await loadFixture(Deploy);

      await Claims.connect(Signer(0)).updateFees(5_000, 2500, 2500);

      const fee = await Claims.basisFee();
      const psr = await Claims.basisProposer();
      const ptc = await Claims.basisProtocol();

      expect(fee).to.equal(5_000);
      expect(psr).to.equal(2500);
      expect(ptc).to.equal(2500);

      expect(fee + psr + ptc).to.equal(10_000);
    });
  });
});
