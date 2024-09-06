import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("burn", function () {
    it("should burn UVX in exchange for stablecoins", async function () {
      const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      {
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        await Stablecoin.connect(Signer(0)).mint(udd, Amount(10));
      }

      {
        expect(await UVX.totalSupply()).to.equal(0);
      }

      {
        expect(await UVX.balanceOf(Address(1))).to.equal(0);
        await UVX.connect(Signer(0)).mint(Address(1), Amount(10));
      }

      {
        expect(await UVX.totalSupply()).to.equal(Amount(10)); // supply created
      }

      {
        expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10));
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        expect(await UVX.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
      }

      {
        await UVX.connect(Signer(1)).approve(Signer(1), Amount(10));
        await UVX.connect(Signer(1)).burn(sdd, Amount(10));
      }

      {
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10)); // address 1 has stablecoins now
        expect(await UVX.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);
      }

      {
        expect(await UVX.totalSupply()).to.equal(0); // all supply burned
      }
    });
  });
});
