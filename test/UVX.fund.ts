import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("fund", function () {
    const deployStablecoins = async () => {
      const { Address, Signer } = await loadFixture(Deploy);

      const Stablecoin6 = await ethers.deployContract("Stablecoin", [6]);
      const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);
      const Stablecoin30 = await ethers.deployContract("Stablecoin", [30]);
      const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin6.getAddress()]);

      // We grant the BOT_ROLE to the default signer, so that we can simply mint
      // tokens for test users.
      await UVX.grantRole(Role("BOT_ROLE"), Address(0));

      // Also whitelist the other stablecoin contracts.
      await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin18.getAddress());
      await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin30.getAddress());

      return { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
    };

    it("signer 1 should be able to fund the UVX contract with 100 stablecoins", async function () {
      const { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

      const udd = await UVX.getAddress();

      // Create an outstanding deficit, so that funding can be executed and the
      // deficit can be balanced.
      {
        expect(await UVX.outstanding()).to.equal(0);
        await UVX.connect(Signer(0)).mint(Address(9), Amount(100, 18));
        expect(await UVX.outstanding()).to.equal(Amount(100, 18));
      }

      {
        expect(await UVX.balanceOf(Address(1))).to.equal(0);
        expect(await UVX.balanceOf(udd)).to.equal(0);
        expect(await UVX.totalSupply()).to.equal(Amount(100, 18));
      }

      // Check everyone's stablecoin balance initially.
      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(0);
        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      // Mint stablecoins for signer 1.
      {
        await Stablecoin6.connect(Signer(0)).mint(Address(1), Amount(40, 6));
        await Stablecoin18.connect(Signer(0)).mint(Address(1), Amount(30, 18));
        await Stablecoin30.connect(Signer(0)).mint(Address(1), Amount(30, 30));
      }

      // Make sure only signer 1 got some stablecoins.
      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(40, 6));
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(Amount(30, 18));
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(30, 30));
        expect(await Stablecoin6.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      // Funding happens between three parties, where UVX acts on behalf of
      // signer 1 in order to transfer stablecoins. From the point of view of
      // the stablecoin contracts, msg.sender will be UVX, on behalf of signer
      // 1. Thus UVX must be declared as spender, because UVX is the
      // facilitating middleman.
      {
        await Stablecoin6.connect(Signer(1)).approve(udd, Amount(40, 6));
        await Stablecoin18.connect(Signer(1)).approve(udd, Amount(30, 18));
        await Stablecoin30.connect(Signer(1)).approve(udd, Amount(30, 30));
      }

      {
        await UVX.connect(Signer(1)).fund(await Stablecoin6.getAddress(), Amount(10, 6));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(30, 6));   // -10
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(Amount(30, 18));
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(30, 30));
        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(10, 6));          // +10
        expect(await Stablecoin18.balanceOf(udd)).to.equal(0);
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      {
        expect(await UVX.outstanding()).to.equal(Amount(90));                      // -10
      }

      {
        await UVX.connect(Signer(1)).fund(await Stablecoin18.getAddress(), Amount(10, 18));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(30, 6));
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(Amount(20, 18)); // -10
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(30, 30));
        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(10, 6));
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(10, 18));        // +10
        expect(await Stablecoin30.balanceOf(udd)).to.equal(0);
      }

      {
        expect(await UVX.outstanding()).to.equal(Amount(80));                      // -10
      }

      {
        await UVX.connect(Signer(1)).fund(await Stablecoin30.getAddress(), Amount(10, 30));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(30, 6));
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(Amount(20, 18));
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(20, 30)); // -10
        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(10, 6));
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(10, 18));
        expect(await Stablecoin30.balanceOf(udd)).to.equal(Amount(10, 30));        // +10
      }

      {
        expect(await UVX.outstanding()).to.equal(Amount(70));                      // -10
      }

      {
        await UVX.connect(Signer(1)).fund(await Stablecoin6.getAddress(), Amount(30, 6));
        await UVX.connect(Signer(1)).fund(await Stablecoin18.getAddress(), Amount(20, 18));
        await UVX.connect(Signer(1)).fund(await Stablecoin30.getAddress(), Amount(20, 30));
      }

      {
        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(0);               // -30
        expect(await Stablecoin18.balanceOf(Address(1))).to.equal(0);              // -20
        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(0);              // -20
        expect(await Stablecoin6.balanceOf(udd)).to.equal(Amount(40, 6));          // +30
        expect(await Stablecoin18.balanceOf(udd)).to.equal(Amount(30, 18));        // +20
        expect(await Stablecoin30.balanceOf(udd)).to.equal(Amount(30, 30));        // +20
      }

      {
        expect(await UVX.outstanding()).to.equal(0);                               // -70
      }

      // There is still a total supply of 100 UVX, but now the UVX deficit is
      // fully balanced.
      {
        expect(await UVX.balanceOf(Address(1))).to.equal(0);
        expect(await UVX.balanceOf(udd)).to.equal(0);
        expect(await UVX.totalSupply()).to.equal(Amount(100, 18));
      }
    });
  });
});
