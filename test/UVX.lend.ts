import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("lend", function () {
    const deployReceiver = async () => {
      const { Address, Signer } = await loadFixture(Deploy);

      const Stablecoin6 = await ethers.deployContract("Stablecoin", [6]);
      const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);
      const Stablecoin30 = await ethers.deployContract("Stablecoin", [30]);

      const Receiver = await ethers.deployContract("Receiver");

      const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin6.getAddress()]);

      // We grant the BOT_ROLE to the default signer, so that we can simply mint
      // tokens for test users.
      await UVX.grantRole(Role("BOT_ROLE"), Address(0));

      // We grant the LOAN_ROLE to the receiver contract, so that we can execute
      // a simulated version of a flash loan borrower.
      await UVX.grantRole(Role("LOAN_ROLE"), await Receiver.getAddress());

      // Also whitelist the other stablecoin contracts.
      await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin18.getAddress());
      await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin30.getAddress());

      return { Address, Receiver, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
    };

    it("should allow signer 3 to flash loan 100 tokens, from 6 to 18 decimals", async function () {
      const { Address, Receiver, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployReceiver);

      const udd = await UVX.getAddress();
      const rdd = await Receiver.getAddress();
      const sd6 = await Stablecoin6.getAddress();
      const s18 = await Stablecoin18.getAddress();

      {
        await Stablecoin6.connect(Signer(0)).mint(udd, Amount(100, 6));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(3))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(3))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(3))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(100, 6)); // UVX owns stablecoins with 6 decimals
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      {
        await UVX.connect(Signer(3)).lend(rdd, sd6, s18, Amount(100, 6));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(3))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(3))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(3))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(100, 18)); // UVX owns stablecoins with 18 decimals
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }
    });

    it("should allow signer 5 to flash loan 100 tokens, from 30 to 6 decimals", async function () {
      const { Address, Receiver, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployReceiver);

      const udd = await UVX.getAddress();
      const rdd = await Receiver.getAddress();
      const sd6 = await Stablecoin6.getAddress();
      const s30 = await Stablecoin30.getAddress();

      {
        await Stablecoin30.connect(Signer(0)).mint(udd, Amount(100, 30));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(5))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(5))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(5))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(Amount(100, 30)); // UVX owns stablecoins with 30 decimals
      }

      {
        await UVX.connect(Signer(5)).lend(rdd, s30, sd6, Amount(100, 30));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(5))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(5))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(5))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(100, 6)); // UVX owns stablecoins with 6 decimals
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }
    });

    it("should allow signer 7 to flash loan 100 tokens, 18 decimals", async function () {
      const { Address, Receiver, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployReceiver);

      const udd = await UVX.getAddress();
      const rdd = await Receiver.getAddress();
      const s18 = await Stablecoin18.getAddress();

      {
        await Stablecoin18.connect(Signer(0)).mint(udd, Amount(100, 18));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(7))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(7))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(7))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(100, 18)); // UVX owns stablecoins with 18 decimals
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      {
        await UVX.connect(Signer(7)).lend(rdd, s18, s18, Amount(100, 18));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(7))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(7))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(7))).to.equal(0);

        expect(await Stablecoin6.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(rdd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(rdd)).to.equal(0);

        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(100, 18)); // UVX owns stablecoins with 18 decimals
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }
    });
  });
});
