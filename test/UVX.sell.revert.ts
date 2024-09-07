import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("sell", function () {
    describe("revert", function () {
      const deployStablecoin = async (dec: number) => {
        const { Address, Signer } = await loadFixture(Deploy);
        const Stablecoin = await ethers.deployContract("Stablecoin", [dec]);
        const UVX = await ethers.deployContract("UVX", [Address(0), await Stablecoin.getAddress()]);

        // We grant the BOT_ROLE to the default signer, so that we can simply mint
        // tokens for test users.
        await UVX.grantRole(Role("BOT_ROLE"), Address(0));

        return { Address, Signer, Stablecoin, UVX };
      };

      it("if token contract not whitelisted, 6 decimals", async function () {
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
          const txn = UVX.connect(Signer(1)).sell(Address(5), Amount(10, 6)); // address 5 is not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 6)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if token contract not whitelisted, 18 decimals", async function () {
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
          const txn = UVX.connect(Signer(1)).sell(Address(5), Amount(10, 18)); // address 5 is not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 18)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if token contract not whitelisted, 30 decimals", async function () {
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
          const txn = UVX.connect(Signer(1)).sell(Address(5), Amount(10, 30)); // address 5 is not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 30)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient allowance, 6 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(9, 6)); // address 1 has only 9 tokens allowed
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(10, 6));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 6)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient allowance, 18 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(9, 18)); // address 1 has only 9 tokens allowed
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(10, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 18)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient allowance, 30 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(9, 30)); // address 1 has only 9 tokens allowed
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(10, 30));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 30)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient balance, 6 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(11, 6));
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(11, 6)); // address 1 has only 10 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 6)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient balance, 18 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(11, 18));
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(11, 18)); // address 1 has only 10 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 18)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });

      it("if insufficient balance, 30 decimals", async function () {
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
          await Stablecoin.connect(Signer(1)).approve(udd, Amount(11, 30));
          const txn = UVX.connect(Signer(1)).sell(sdd, Amount(11, 30)); // address 1 has only 10 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await Stablecoin.totalSupply()).to.equal(Amount(10, 30)); // supply created
          expect(await UVX.totalSupply()).to.equal(0);
        }
      });
    });
  });
});
