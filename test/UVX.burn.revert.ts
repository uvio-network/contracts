import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Deploy } from "./src/Deploy";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("burn", function () {
    describe("revert", function () {
      it("if token contract not whitelisted", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11));
        }

        {
          expect(await UVX.outstanding()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10));
        }

        {
          expect(await UVX.outstanding()).to.equal(Amount(10)); // minting created a deficit
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10));
          const txn = UVX.connect(Signer(1)).burn(Address(5), Amount(10)); // address 5 is not a whitelisted token contract

          await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
        }
      });

      it("if insufficient allowance", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11));
        }

        {
          expect(await UVX.outstanding()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10));
        }

        {
          expect(await UVX.outstanding()).to.equal(Amount(10)); // minting created a deficit
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(10)); // address 1 has only 10 tokens allowed
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }
      });

      it("if signer 1 has an insufficient UVX balance", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(11));
        }

        {
          expect(await UVX.outstanding()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(10));
        }

        {
          expect(await UVX.outstanding()).to.equal(Amount(10)); // minting created a deficit
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(11));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(10));
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11)); // address 1 has only 10 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }
      });

      it("if UVX contract has an insufficient stablecoin balance", async function () {
        const { Address, Signer, Stablecoin, UVX } = await loadFixture(Deploy);

        const udd = await UVX.getAddress();
        const sdd = await Stablecoin.getAddress();

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(0);
          await Stablecoin.connect(Signer(0)).mint(udd, Amount(10));
        }

        {
          expect(await UVX.outstanding()).to.equal(0);
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
          await UVX.connect(Signer(0)).mint(Address(1), Amount(11));
        }

        {
          expect(await UVX.outstanding()).to.equal(Amount(11)); // minting created a deficit
        }

        {
          expect(await Stablecoin.balanceOf(udd)).to.equal(Amount(10));
          expect(await Stablecoin.balanceOf(Address(1))).to.equal(0); // address 1 has no stablecoins
          expect(await UVX.balanceOf(udd)).to.equal(0);
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(11));
        }

        {
          await UVX.connect(Signer(1)).approve(Signer(1), Amount(11));
          const txn = UVX.connect(Signer(1)).burn(sdd, Amount(11)); // address 1 has only 10 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }
      });
    });
  });
});
