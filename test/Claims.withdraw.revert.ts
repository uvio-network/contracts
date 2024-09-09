import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalance25False } from "./src/Deploy";
import { UpdateBalance25True } from "./src/Deploy";
import { UpdateBalance20True30False } from "./src/Deploy";
import { UpdateBalance30True20False } from "./src/Deploy";
import { UpdateBalance70True115False } from "./src/Deploy";

describe("Claims", function () {
  describe("withdraw", function () {
    describe("revert", function () {
      describe("deplomement", function () {
        it("if signer 0 has no funds", async function () {
          const { Claims, Signer } = await loadFixture(Deploy);

          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 1 has no funds", async function () {
          const { Claims, Signer } = await loadFixture(Deploy);

          const txn = Claims.connect(Signer(1)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 2 has no funds", async function () {
          const { Claims, Signer } = await loadFixture(Deploy);

          const txn = Claims.connect(Signer(2)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });

      describe("25 true", function () {
        it("if signer 0 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25True);

          expect(await UVX.balanceOf(Address(0))).to.equal(0);

          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });

      describe("25 false", function () {
        it("if signer 0 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25False);

          expect(await UVX.balanceOf(Address(0))).to.equal(0);

          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });

      describe("20 true 30 false", function () {
        it("if signer 3 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

          expect(await UVX.balanceOf(Address(3))).to.equal(0);

          const txn = Claims.connect(Signer(3)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 4 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

          expect(await UVX.balanceOf(Address(4))).to.equal(0);

          const txn = Claims.connect(Signer(4)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 5 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

          expect(await UVX.balanceOf(Address(5))).to.equal(0);

          const txn = Claims.connect(Signer(5)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });

      describe("30 true 20 false", function () {
        it("if signer 2 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

          expect(await UVX.balanceOf(Address(2))).to.equal(0);

          const txn = Claims.connect(Signer(2)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });

      describe("70 true 115 false", function () {
        it("if signer 4 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance70True115False);

          expect(await UVX.balanceOf(Address(4))).to.equal(Amount(25)); // got 50 only spent 25

          const txn = Claims.connect(Signer(4)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 5 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance70True115False);

          expect(await UVX.balanceOf(Address(5))).to.equal(Amount(20)); // got 50 only spent 30

          const txn = Claims.connect(Signer(5)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 6 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance70True115False);

          expect(await UVX.balanceOf(Address(6))).to.equal(Amount(20)); // got 50 only spent 30

          const txn = Claims.connect(Signer(6)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 7 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance70True115False);

          expect(await UVX.balanceOf(Address(7))).to.equal(Amount(30)); // got 50 only spent 20

          const txn = Claims.connect(Signer(7)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });

        it("if signer 8 tries to withdraw any tokens", async function () {
          const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance70True115False);

          expect(await UVX.balanceOf(Address(8))).to.equal(Amount(40)); // got 50 only spent 10

          const txn = Claims.connect(Signer(8)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        });
      });
    });
  });
});
