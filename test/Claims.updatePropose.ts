import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("updatePropose", function () {
    describe("whitelist", function () {
      const deployStablecoins = async () => {
        const { Address, Signer } = await loadFixture(Deploy);

        const Stablecoin6 = await ethers.deployContract("Stablecoin", [6]);
        const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);
        const Stablecoin30 = await ethers.deployContract("Stablecoin", [30]);

        const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin6.getAddress()]);

        const Claims = await ethers.deployContract("Claims", [Address(0), await UVX.getAddress()]);

        // We grant the BOT_ROLE to the default signer, so that we can simply mint
        // tokens for test users.
        await UVX.grantRole(Role("BOT_ROLE"), Address(0));

        // We grant the CONTRACT_ROLE to the Claims contract, so that UVX tokens can
        // be transferred to and from the Claims contract.
        await UVX.grantRole(Role("CONTRACT_ROLE"), await Claims.getAddress());

        // Also whitelist the other stablecoin contracts.
        await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin18.getAddress());
        await UVX.grantRole(Role("TOKEN_ROLE"), await Stablecoin30.getAddress());

        return { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      const updateProposeSameToken = async () => {
        const { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const udd = await Claims.getAddress();
        const ad6 = await Stablecoin6.getAddress();
        const a18 = await Stablecoin18.getAddress();
        const a30 = await Stablecoin30.getAddress();

        {
          await Stablecoin30.connect(Signer(0)).mint(Address(1), Amount(40, 30));
          await Stablecoin30.connect(Signer(0)).mint(Address(2), Amount(1, 30));
          await Stablecoin30.connect(Signer(0)).mint(Address(3), 1); // a single token on the lowest decimal
        }

        {
          await UVX.connect(Signer(0)).mint(Address(1), Amount(40, 18));
          await UVX.connect(Signer(0)).mint(Address(2), Amount(40, 18));
          await UVX.connect(Signer(0)).mint(Address(3), Amount(40, 18));
        }

        {
          await UVX.connect(Signer(1)).approve(udd, Amount(40, 18));
          await UVX.connect(Signer(2)).approve(udd, Amount(40, 18));
          await UVX.connect(Signer(3)).approve(udd, Amount(40, 18));
        }

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          [ad6, a18, a30],
        );

        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          2, // a30 from above
        );

        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          2, // a30 from above
        );

        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          2, // a30 from above
        );

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          2, // a30 from above
        );

        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          2, // a30 from above
        );

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          2, // a30 from above
        );

        return { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      const updateProposeDifferentTokens = async () => {
        const { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const udd = await Claims.getAddress();
        const ad6 = await Stablecoin6.getAddress();
        const a18 = await Stablecoin18.getAddress();
        const a30 = await Stablecoin30.getAddress();

        {
          await Stablecoin6.connect(Signer(0)).mint(Address(1), Amount(40, 6));
          await Stablecoin18.connect(Signer(0)).mint(Address(2), Amount(1, 18));
          await Stablecoin30.connect(Signer(0)).mint(Address(3), 1); // a single token on the lowest decimal
        }

        {
          await UVX.connect(Signer(0)).mint(Address(1), Amount(40, 18));
          await UVX.connect(Signer(0)).mint(Address(2), Amount(40, 18));
          await UVX.connect(Signer(0)).mint(Address(3), Amount(40, 18));
        }

        {
          await UVX.connect(Signer(1)).approve(udd, Amount(40, 18));
          await UVX.connect(Signer(2)).approve(udd, Amount(40, 18));
          await UVX.connect(Signer(3)).approve(udd, Amount(40, 18));
        }

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          [ad6, a18, a30],
        );

        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          1, // a18 from above
        );

        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          2, // a30 from above
        );

        await Claims.connect(Signer(2)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          1, // a18 from above
        );

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0, // ad6 from above
        );

        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(10),
          Side(false),
          2, // a30 from above
        );

        await Claims.connect(Signer(1)).updatePropose(
          Claim(1),
          Amount(10),
          Side(true),
          0, // ad6 from above
        );

        return { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      it("should allow everyone with the same whitelisted tokens to stake, same tokens", async function () {
        const { Claims } = await loadFixture(updateProposeSameToken);

        const res = await Claims.searchPropose(Claim(1));

        expect(res[0]).to.equal(Amount(40)); // yay
        expect(res[1]).to.equal(Amount(10)); // min
        expect(res[2]).to.equal(Amount(30)); // nah

        expect(res[0] + res[2]).to.equal(Amount(70));
      });

      it("should leave whitelisted token balances unchanged after staking, same tokens", async function () {
        const { Address, Stablecoin30 } = await loadFixture(updateProposeSameToken);

        expect(await Stablecoin30.balanceOf(Address(1))).to.equal(Amount(40, 30));
        expect(await Stablecoin30.balanceOf(Address(2))).to.equal(Amount(1, 30));
        expect(await Stablecoin30.balanceOf(Address(3))).to.equal(1);
      });

      it("should allow everyone with the same whitelisted tokens to stake, different tokens", async function () {
        const { Claims } = await loadFixture(updateProposeDifferentTokens);

        const res = await Claims.searchPropose(Claim(1));

        expect(res[0]).to.equal(Amount(40)); // yay
        expect(res[1]).to.equal(Amount(10)); // min
        expect(res[2]).to.equal(Amount(30)); // nah

        expect(res[0] + res[2]).to.equal(Amount(70));
      });

      it("should leave whitelisted token balances unchanged after staking, different tokens", async function () {
        const { Address, Stablecoin6, Stablecoin18, Stablecoin30 } = await loadFixture(updateProposeDifferentTokens);

        expect(await Stablecoin6.balanceOf(Address(1))).to.equal(Amount(40, 6));
        expect(await Stablecoin18.balanceOf(Address(2))).to.equal(Amount(1, 18));
        expect(await Stablecoin30.balanceOf(Address(3))).to.equal(1);
      });

      it("should allow anyone to propose with whitelisted tokens without owning them", async function () {
        const { Address, Claims, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const udd = await Claims.getAddress();
        const a18 = await Stablecoin18.getAddress();
        const a30 = await Stablecoin30.getAddress();

        {
          await UVX.connect(Signer(0)).mint(Address(5), Amount(10, 18));
          await UVX.connect(Signer(5)).approve(udd, Amount(10, 18));
        }

        {
          expect(await Stablecoin6.balanceOf(Address(5))).to.equal(0);
          expect(await Stablecoin18.balanceOf(Address(5))).to.equal(0);
          expect(await Stablecoin30.balanceOf(Address(5))).to.equal(0);
        }

        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
          [a18, a30],
        );

        {
          expect(await Stablecoin6.balanceOf(Address(5))).to.equal(0);
          expect(await Stablecoin18.balanceOf(Address(5))).to.equal(0);
          expect(await Stablecoin30.balanceOf(Address(5))).to.equal(0);
        }
      });
    });
  });
});
