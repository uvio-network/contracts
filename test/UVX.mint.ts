import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("mint", function () {
    it("should mint to signer 1 using BOT_ROLE", async function () {
      const { Address, Signer, UVX } = await loadFixture(Deploy);

      expect(await UVX.balanceOf(Address(1))).to.equal(0);
      expect(await UVX.balanceOf(Address(5))).to.equal(0);
      expect(await UVX.balanceOf(Address(7))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);

      await UVX.connect(Signer(0)).mint(Address(1), Amount(100));

      expect(await UVX.balanceOf(Address(1))).to.equal(Amount(100));
      expect(await UVX.balanceOf(Address(5))).to.equal(0);
      expect(await UVX.balanceOf(Address(7))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);
    });

    it("should mint to signer 5 using BOT_ROLE", async function () {
      const { Address, Signer, UVX } = await loadFixture(Deploy);

      expect(await UVX.balanceOf(Address(5))).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);
      expect(await UVX.balanceOf(Address(7))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);

      await UVX.connect(Signer(0)).mint(Address(5), Amount(100));

      expect(await UVX.balanceOf(Address(5))).to.equal(Amount(100));
      expect(await UVX.balanceOf(Address(1))).to.equal(0);
      expect(await UVX.balanceOf(Address(7))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);
    });

    it("should mint to signer 7 if signer 9 receives the BOT_ROLE", async function () {
      const { Address, Signer, UVX } = await loadFixture(Deploy);

      expect(await UVX.balanceOf(Address(7))).to.equal(0);
      expect(await UVX.balanceOf(Address(1))).to.equal(0);
      expect(await UVX.balanceOf(Address(5))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);

      await UVX.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

      await UVX.connect(Signer(9)).mint(Address(7), Amount(100));

      expect(await UVX.balanceOf(Address(7))).to.equal(Amount(100));
      expect(await UVX.balanceOf(Address(1))).to.equal(0);
      expect(await UVX.balanceOf(Address(5))).to.equal(0);
      expect(await UVX.balanceOf(Address(9))).to.equal(0);
    });
  });
});
