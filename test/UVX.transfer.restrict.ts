import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";

describe("UVX", function () {
  describe("transfer", function () {
    describe("restrict", function () {
      it("unrestricted should transfer between signer 0 and signer 5", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateRestrict();

        await Balance([0], 10);

        expect(await UVX.balanceOf(Address(0))).to.equal(Amount(10));
        expect(await UVX.balanceOf(Address(5))).to.equal(0);

        // transfer approves for msg.sender
        await UVX.connect(Signer(0)).transfer(Address(5), Amount(10));

        expect(await UVX.balanceOf(Address(0))).to.equal(0);
        expect(await UVX.balanceOf(Address(5))).to.equal(Amount(10));
      });

      it("unrestricted should transfer between signer 1 and signer 2", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateRestrict();

        await Balance([1], 10);

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
        expect(await UVX.balanceOf(Address(2))).to.equal(0);

        // transfer approves for msg.sender
        await UVX.connect(Signer(1)).transfer(Address(2), Amount(10));

        expect(await UVX.balanceOf(Address(1))).to.equal(0);
        expect(await UVX.balanceOf(Address(2))).to.equal(Amount(10));
      });

      it("unrestricted should transferFrom between signer 0 and signer 5", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateRestrict();

        await Balance([0], 10);

        expect(await UVX.balanceOf(Address(0))).to.equal(Amount(10));
        expect(await UVX.balanceOf(Address(5))).to.equal(0);

        await UVX.connect(Signer(0)).approve(Address(0), Amount(10));
        await UVX.connect(Signer(0)).transferFrom(Address(0), Address(5), Amount(10));

        expect(await UVX.balanceOf(Address(0))).to.equal(0);
        expect(await UVX.balanceOf(Address(5))).to.equal(Amount(10));
      });

      it("unrestricted should transferFrom between signer 1 and signer 2", async function () {
        const { Address, Balance, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateRestrict();

        await Balance([1], 10);

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
        expect(await UVX.balanceOf(Address(2))).to.equal(0);

        await UVX.connect(Signer(1)).approve(Address(1), Amount(10));
        await UVX.connect(Signer(1)).transferFrom(Address(1), Address(2), Amount(10));

        expect(await UVX.balanceOf(Address(1))).to.equal(0);
        expect(await UVX.balanceOf(Address(2))).to.equal(Amount(10));
      });
    });
  });
});
