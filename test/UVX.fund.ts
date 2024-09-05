import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("fund", function () {
    it("signer 1 should be able to fund the UVX contract with 10 stablecoins", async function () {
      const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

      expect(await UVX.outstanding()).to.equal(0);

      // Create an outstanding deficit, so that funding can be executed.
      await UVX.connect(Signer(0)).mint(Address(9), Amount(100));

      expect(await UVX.outstanding()).to.equal(Amount(100));

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
      expect(await Stablecoin.balanceOf(udd)).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);

      await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10));

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10));
      expect(await Stablecoin.balanceOf(udd)).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);

      await Stablecoin.connect(Signer(1)).approve(udd, Amount(10));
      await UVX.connect(Signer(1)).fund(sdd, Amount(10));

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
      expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10));
      expect(await UVX.balanceOf(Address(1))).to.equal(0);

      expect(await UVX.outstanding()).to.equal(Amount(90));
    });
  });
});
