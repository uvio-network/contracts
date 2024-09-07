import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("sell", function () {
    const deployStablecoin = async (dec: number) => {
      const { Address, Signer } = await loadFixture(Deploy);
      const Stablecoin = await ethers.deployContract("Stablecoin", [dec]);
      const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin.getAddress()]);

      // We grant the BOT_ROLE to the default signer, so that we can simply mint
      // tokens for test users.
      await UVX.grantRole(Role("BOT_ROLE"), Address(0));

      return { Address, Signer, Stablecoin, UVX };
    };

    it("should sell 10 UVX to signer 1 for 10 stablecoins, 6 decimals", async function () {
      const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(6);

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      {
        expect(await Stablecoin.totalSupply()).to.equal(0);
        expect(await UVX.totalSupply()).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10, 6));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 6));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0); // UVX has no stablecoins
        expect(await UVX.balanceOf(Address(1))).to.equal(0); // address 1 has no UVX
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(1)).approve(udd, Amount(10, 6));
        await UVX.connect(Signer(1)).sell(sdd, Amount(10, 6));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 6));  // UVX has 10 stablecoins now
        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX now
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 6)); // supply created
        expect(await UVX.totalSupply()).to.equal(Amount(10, 18));       // supply created
      }
    });

    it("should sell 10 UVX to signer 1 for 10 stablecoins, 18 decimals", async function () {
      const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(18);

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      {
        expect(await Stablecoin.totalSupply()).to.equal(0);
        expect(await UVX.totalSupply()).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10, 18));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 18));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0); // UVX has no stablecoins
        expect(await UVX.balanceOf(Address(1))).to.equal(0); // address 1 has no UVX
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(1)).approve(udd, Amount(10, 18));
        await UVX.connect(Signer(1)).sell(sdd, Amount(10, 18));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 18));  // UVX has 10 stablecoins now
        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX now
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 18)); // supply created
        expect(await UVX.totalSupply()).to.equal(Amount(10, 18));       // supply created
      }
    });

    it("should sell 10 UVX to signer 1 for 10 stablecoins, 30 decimals", async function () {
      const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

      const udd = await UVX.getAddress();
      const sdd = await Stablecoin.getAddress();

      {
        expect(await Stablecoin.totalSupply()).to.equal(0);
        expect(await UVX.totalSupply()).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(0)).mint(Address(1), Amount(10, 30));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 30));
        expect(await Stablecoin.balanceOf(udd)).to.equal(0); // UVX has no stablecoins
        expect(await UVX.balanceOf(Address(1))).to.equal(0); // address 1 has no UVX
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        await Stablecoin.connect(Signer(1)).approve(udd, Amount(10, 30));
        await UVX.connect(Signer(1)).sell(sdd, Amount(10, 30));
      }

      {
        expect(await Stablecoin.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 30));  // UVX has 10 stablecoins now
        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX now
        expect(await UVX.balanceOf(udd)).to.equal(0);
      }

      {
        expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 30)); // supply created
        expect(await UVX.totalSupply()).to.equal(Amount(10, 18));       // supply created
      }
    });
  });
});
