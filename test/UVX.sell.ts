import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("sell", function () {
    it("should sell 10 UVX to signer 1 for 10 stablecoins", async function () {
      const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      expect(await UVX.outstanding()).to.equal(0);

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
      expect(await Stablecoin.balanceOf(udd)).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);

      await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10));

      expect(await UVX.outstanding()).to.equal(0);

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10));
      expect(await Stablecoin.balanceOf(udd)).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);

      await Stablecoin.connect(Signer(1)).approve(udd, Amount(10));
      await UVX.connect(Signer(1)).sell(sdd, Amount(10));

      expect(await UVX.outstanding()).to.equal(0);

      expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
      expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10));
      expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
    });
  });
});
