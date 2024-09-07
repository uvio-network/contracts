import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("burn", function () {
    const deployStablecoin = async (dec: number) => {
      const { Address, Signer } = await loadFixture(Deploy);
      const Stablecoin = await ethers.deployContract("Stablecoin", [dec]);
      const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin.getAddress()]);

      // We grant the BOT_ROLE to the default signer, so that we can simply mint
      // tokens for test users.
      await UVX.grantRole(Role("BOT_ROLE"), Address(0));

      return { Address, Signer, Stablecoin, UVX };
    };

    describe("single", function () {
      it("should burn UVX in exchange for stablecoins, 6 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(6);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 6));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 6));
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        // Burning happens only between signer 1 and UVX itself. There are only
        // two parties involved. That is why from the perspective of UVX,
        // msg.sender, and thus the spender is in first instance signer 1.
        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 6)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });

      it("should burn UVX in exchange for stablecoins, 18 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(18);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 18));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 18));
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });

      it("should burn UVX in exchange for stablecoins, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 30));
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 30));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18));
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(10, 30)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });
    });

    describe("multi", function () {
      it("should burn UVX in exchange for stablecoins, 6 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(6);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(100, 6));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(100, 6));
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(100, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(100, 18));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(100, 18)); // supply created
        }

        // Burning happens only between signer 1 and UVX itself. There are only
        // two parties involved. That is why from the perspective of UVX,
        // msg.sender, and thus the spender is in first instance signer 1.
        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(100, 18)); // allow all
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(10, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(100, 6)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });

      it("should burn UVX in exchange for stablecoins, 18 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(18);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(100, 18));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(100, 18));
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(100, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(100, 18));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(100, 18)); // supply created
        }

        // Burning happens only between signer 1 and UVX itself. There are only
        // two parties involved. That is why from the perspective of UVX,
        // msg.sender, and thus the spender is in first instance signer 1.
        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(100, 18)); // allow all
          await UVX.connect(Signer(1)).burn(sdd, Amount(7, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(13, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(5, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(15, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(4, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(16, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(8, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(12, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(9, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(100, 18)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });

      it("should burn UVX in exchange for stablecoins, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(100, 30));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(100, 30));
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(100, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(100, 18));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(100, 18)); // supply created
        }

        // Burning happens only between signer 1 and UVX itself. There are only
        // two parties involved. That is why from the perspective of UVX,
        // msg.sender, and thus the spender is in first instance signer 1.
        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(100, 18)); // allow all
          await UVX.connect(Signer(1)).burn(sdd, Amount(13, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(7, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(3, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(17, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(20, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(25, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(5, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(2, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(2, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(2, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(2, 18));
          await UVX.connect(Signer(1)).burn(sdd, Amount(2, 18));
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(Amount(100, 30)); // address 1 has stablecoins now
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0); // all supply burned
        }
      });
    });
  });
});
