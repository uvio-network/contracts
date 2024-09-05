import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("sell", function () {
    describe("revert", function () {
      it("if token contract not whitelisted", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10));

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(1)).approve(udd, Amount(10));
        const txn = UVX.connect(Signer(1)).sell(Address(5), Amount(10)); // address 5 is not a whitelisted token contract

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if insufficient allowance", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10));

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(1)).approve(udd, Amount(10)); // address 1 has only 10 tokens allowed
        const txn = UVX.connect(Signer(1)).sell(sdd, Amount(11));

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
      });

      it("if insufficient balance", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10));

        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0);
        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Stablecoin.connect(Signer(1)).approve(udd, Amount(11));
        const txn = UVX.connect(Signer(1)).sell(sdd, Amount(11)); // address 1 has only 10 tokens

        await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
      });
    });
  });
});
