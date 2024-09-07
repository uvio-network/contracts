import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";
import { zeroAddress } from "viem";

describe("UVX", function () {
  describe("burn", function () {
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

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18));
          const txn = UVX.connect(Signer(1)).burn(Address(5), Amount(10, 18)); // address 5 is not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if token contract signer 0, 18 decimals", async function () {
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
          const txn = UVX.connect(Signer(1)).burn(Address(0), Amount(10, 18)); // owner not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if token contract zero address, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 30));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 30));
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
          const txn = UVX.connect(Signer(1)).burn(zeroAddress, Amount(10, 18)); // zeroAddresss not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if insufficient allowance, 6 decimals", async function () {
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

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18)); // address 1 has only 10 tokens allowed
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if insufficient allowance, 18 decimals", async function () {
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
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18)); // address 1 has only 10 tokens allowed
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if insufficient allowance, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 30));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 30));
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
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10, 18)); // address 1 has only 10 tokens allowed
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if signer 1 has an insufficient UVX balance, 6 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(6);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11, 6));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11, 6)); // UVX has 11 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if signer 1 has an insufficient UVX balance, 18 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(18);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11, 18));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11, 18)); // UVX has 11 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if signer 1 has an insufficient UVX balance, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11, 30));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11, 30)); // UVX has 11 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10, 18)); // address 1 has 10 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(10, 18)); // supply unchanged
        }
      });

      it("if UVX contract has an insufficient stablecoin balance, 6 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(6);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 6));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 6)); // UVX has 10 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(11, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(11, 18)); // address 1 has 11 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply unchanged
        }
      });

      it("if UVX contract has an insufficient stablecoin balance, 18 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(18);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 18));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 18)); // UVX has 10 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(11, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(11, 18)); // address 1 has 11 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply unchanged
        }
      });

      it("if UVX contract has an insufficient stablecoin balance, 30 decimals", async function () {
        const { Address, Signer, Stablecoin, UVX } = await deployStablecoin(30);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10, 30));
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10, 30)); // UVX has 10 stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
        }

        {
          expect(await UVX.totalSupply()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(11, 18));
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(11, 18)); // address 1 has 11 UVX
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply created
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11, 18));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11, 18));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }

        {
          expect(await UVX.totalSupply()).to.equal(Amount(11, 18)); // supply unchanged
        }
      });
    });
  });
});
