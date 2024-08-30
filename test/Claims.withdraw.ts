import { Amount } from "./src/Amount";
import { UpdateBalance25False } from "./src/Deploy";
import { UpdateBalance25True } from "./src/Deploy";
import { UpdateBalance20True30False } from "./src/Deploy";
import { UpdateBalance30True20False } from "./src/Deploy";
import { UpdateBalance70True115False } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Claims", function () {
  describe("withdraw", function () {
    describe("25 true", function () {
      it("if signer 0 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance25True);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance25True);

        expect(await Token.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 25 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance25True);

        expect(await Token.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(5));
        await Claims.connect(Signer(1)).withdraw(Amount(10));
        await Claims.connect(Signer(1)).withdraw(Amount(10));

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });

    describe("25 false", function () {
      it("if signer 0 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance25False);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance25False);

        expect(await Token.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });

    describe("20 true 30 false", function () {
      it("should allow signer 0 to withdraw 2.50 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        await Claims.connect(Signer(0)).withdraw(Amount(2.50));

        expect(await Token.balanceOf(Address(0))).to.equal(Amount(2.50));

        const res = await Claims.searchBalance(Address(0));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 0 to withdraw 2.50 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        await Claims.connect(Signer(0)).withdraw(Amount(0.50));
        await Claims.connect(Signer(0)).withdraw(Amount(1.10));
        await Claims.connect(Signer(0)).withdraw(Amount(0.90));

        expect(await Token.balanceOf(Address(0))).to.equal(Amount(2.50));

        const res = await Claims.searchBalance(Address(0));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 2 to withdraw 22.50 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(2))).to.equal(0);

        await Claims.connect(Signer(2)).withdraw(Amount(22.50));

        expect(await Token.balanceOf(Address(2))).to.equal(Amount(22.50));

        const res = await Claims.searchBalance(Address(2));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(2)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 3 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(3))).to.equal(0);

        const txn = Claims.connect(Signer(3)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 4 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(4))).to.equal(0);

        const txn = Claims.connect(Signer(4)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 5 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance20True30False);

        expect(await Token.balanceOf(Address(5))).to.equal(0);

        const txn = Claims.connect(Signer(5)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });

    describe("30 true 20 false", function () {
      it("should allow signer 0 to withdraw 2.50 tokens plus captured precision loss once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        await Claims.connect(Signer(0)).withdraw("2500000000000000018");

        expect(await Token.balanceOf(Address(0))).to.equal("2500000000000000018");

        const res = await Claims.searchBalance(Address(0));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 2.50 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(2.50));

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(2.50));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 2 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(2))).to.equal(0);

        const txn = Claims.connect(Signer(2)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 3 to withdraw about 15 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(3))).to.equal(0);

        await Claims.connect(Signer(3)).withdraw("14999999999999999994");

        expect(await Token.balanceOf(Address(3))).to.equal("14999999999999999994");

        const res = await Claims.searchBalance(Address(3));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(3)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 3 to withdraw about 15 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(3))).to.equal(0);

        await Claims.connect(Signer(3)).withdraw(Amount(5));
        await Claims.connect(Signer(3)).withdraw(Amount(5));

        expect(await Token.balanceOf(Address(3))).to.equal(Amount(10));

        const res = await Claims.searchBalance(Address(3));

        expect(res[0]).to.equal(0);                     // allocated
        expect(res[1]).to.equal("4999999999999999994"); // available

        const txn = Claims.connect(Signer(3)).withdraw(Amount(5));

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 4 to withdraw about 15 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(4))).to.equal(0);

        await Claims.connect(Signer(4)).withdraw("14999999999999999994");

        expect(await Token.balanceOf(Address(4))).to.equal("14999999999999999994");

        const res = await Claims.searchBalance(Address(4));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(4)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 5 to withdraw about 15 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance30True20False);

        expect(await Token.balanceOf(Address(5))).to.equal(0);

        await Claims.connect(Signer(5)).withdraw("14999999999999999994");

        expect(await Token.balanceOf(Address(5))).to.equal("14999999999999999994");

        const res = await Claims.searchBalance(Address(5));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(5)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });

    describe("70 true 115 false", function () {
      it("should allow signer 0 to withdraw 9.25 tokens plus captured precision loss once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(0))).to.equal(0);

        await Claims.connect(Signer(0)).withdraw("9250000000000000104");

        expect(await Token.balanceOf(Address(0))).to.equal("9250000000000000104");

        const res = await Claims.searchBalance(Address(0));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(0)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 1 to withdraw 56.82 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(1))).to.equal(Amount(30)); // got 50 only spent 20

        await Claims.connect(Signer(1)).withdraw("56821428571428571399");

        expect(await Token.balanceOf(Address(1))).to.equal("86821428571428571399"); // + 30

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 2 to withdraw 47.57 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(2))).to.equal(Amount(30)); // got 50 only spent 20

        await Claims.connect(Signer(2)).withdraw("47571428571428571399");

        expect(await Token.balanceOf(Address(2))).to.equal("77571428571428571399"); // + 30

        const res = await Claims.searchBalance(Address(2));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(2)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("should allow signer 3 to withdraw 71.36 tokens once", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(3))).to.equal(Amount(20)); // got 50 only spent 30

        await Claims.connect(Signer(3)).withdraw("71357142857142857098");

        expect(await Token.balanceOf(Address(3))).to.equal("91357142857142857098"); // + 20

        const res = await Claims.searchBalance(Address(3));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(3)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 4 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(4))).to.equal(Amount(25)); // got 50 only spent 25

        const txn = Claims.connect(Signer(4)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 5 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(5))).to.equal(Amount(20)); // got 50 only spent 30

        const txn = Claims.connect(Signer(5)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 6 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(6))).to.equal(Amount(20)); // got 50 only spent 30

        const txn = Claims.connect(Signer(6)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 7 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(7))).to.equal(Amount(30)); // got 50 only spent 20

        const txn = Claims.connect(Signer(7)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });

      it("if signer 8 tries to withdraw any tokens", async function () {
        const { Address, Claims, Signer, Token } = await loadFixture(UpdateBalance70True115False);

        expect(await Token.balanceOf(Address(8))).to.equal(Amount(40)); // got 50 only spent 10

        const txn = Claims.connect(Signer(8)).withdraw(1);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Balance");
      });
    });
  });
});
