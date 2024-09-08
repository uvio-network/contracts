import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("lend", function () {
    describe("revert", function () {
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

      const deployReceiver = async () => {
        const { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const Receiver = await ethers.deployContract("Receiver");

        // We grant the LOAN_ROLE to the receiver contract, so that we can execute
        // a simulated version of a flash loan borrower.
        await UVX.grantRole(Role("LOAN_ROLE"), await Receiver.getAddress());

        return { Address, Receiver, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      const deployReceiverNoApprove = async () => {
        const { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const ReceiverNoApprove = await ethers.deployContract("ReceiverNoApprove");

        // We grant the LOAN_ROLE to the receiver contract, so that we can execute
        // a simulated version of a flash loan borrower.
        await UVX.grantRole(Role("LOAN_ROLE"), await ReceiverNoApprove.getAddress());

        return { Address, ReceiverNoApprove, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      const deployReceiverReentrance = async () => {
        const { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const ReceiverReentrance = await ethers.deployContract("ReceiverReentrance");

        // We grant the LOAN_ROLE to the receiver contract, so that we can execute
        // a simulated version of a flash loan borrower.
        await UVX.grantRole(Role("LOAN_ROLE"), await ReceiverReentrance.getAddress());

        return { Address, ReceiverReentrance, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      }

      const deployReceiverMintLess = async () => {
        const { Address, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX } = await loadFixture(deployStablecoins);

        const ReceiverMintLess = await ethers.deployContract("ReceiverMintLess");

        // We grant the LOAN_ROLE to the receiver contract, so that we can execute
        // a simulated version of a flash loan borrower.
        await UVX.grantRole(Role("LOAN_ROLE"), await ReceiverMintLess.getAddress());

        return { Address, ReceiverMintLess, Signer, Stablecoin6, Stablecoin18, Stablecoin30, UVX };
      };

      it("if receiver not whitelisted, signer 9", async function () {
        const { Address, Signer, Stablecoin18, UVX } = await loadFixture(deployReceiver);

        const s18 = await Stablecoin18.getAddress();

        const txn = UVX.connect(Signer(7)).lend(Address(9), s18, s18, Amount(100, 18));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if receiver not whitelisted, fake receiver", async function () {
        const { Signer, Stablecoin18, UVX } = await loadFixture(deployReceiver);

        const Fake = await ethers.deployContract("ReceiverReentrance");
        const fdd = await Fake.getAddress();
        const s18 = await Stablecoin18.getAddress();

        const txn = UVX.connect(Signer(7)).lend(fdd, s18, s18, Amount(100, 18));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if token one not whitelisted", async function () {
        const { Receiver, Signer, Stablecoin18, UVX } = await loadFixture(deployReceiver);

        const udd = await UVX.getAddress();
        const rdd = await Receiver.getAddress();
        const Stablecoin13 = await ethers.deployContract("Stablecoin", [13]);
        const s13 = await Stablecoin13.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin13.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        const txn = UVX.connect(Signer(7)).lend(rdd, s13, s18, Amount(100, 13));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if token two not whitelisted", async function () {
        const { Receiver, Signer, Stablecoin18, UVX } = await loadFixture(deployReceiver);

        const udd = await UVX.getAddress();
        const rdd = await Receiver.getAddress();
        const Stablecoin13 = await ethers.deployContract("Stablecoin", [13]);
        const s13 = await Stablecoin13.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin13.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        const txn = UVX.connect(Signer(7)).lend(rdd, s18, s13, Amount(100, 13));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if token one insufficient balance", async function () {
        const { Receiver, Signer, Stablecoin6, Stablecoin18, UVX } = await loadFixture(deployReceiver);

        const udd = await UVX.getAddress();
        const rdd = await Receiver.getAddress();
        const sd6 = await Stablecoin6.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin6.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        {
          const txn = UVX.connect(Signer(3)).lend(rdd, sd6, s18, Amount(101, 6)); // UVX only has 100 tokens

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }
      });

      it("if receiver no approve", async function () {
        const { ReceiverNoApprove, Signer, Stablecoin6, Stablecoin18, UVX } = await loadFixture(deployReceiverNoApprove);

        const udd = await UVX.getAddress();
        const rdd = await ReceiverNoApprove.getAddress();
        const sd6 = await Stablecoin6.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin6.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        {
          const txn = UVX.connect(Signer(3)).lend(rdd, sd6, s18, Amount(100, 6));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }
      });

      it("if receiver reentrance", async function () {
        const { ReceiverReentrance, Signer, Stablecoin6, Stablecoin18, UVX } = await loadFixture(deployReceiverReentrance);

        const udd = await UVX.getAddress();
        const rdd = await ReceiverReentrance.getAddress();
        const sd6 = await Stablecoin6.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin6.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        {
          const txn = UVX.connect(Signer(3)).lend(rdd, sd6, s18, Amount(100, 6));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ReentrancyGuardReentrantCall");
        }
      });

      it("if receiver insufficient balance", async function () {
        const { ReceiverMintLess, Signer, Stablecoin6, Stablecoin18, UVX } = await loadFixture(deployReceiverMintLess);

        const udd = await UVX.getAddress();
        const rdd = await ReceiverMintLess.getAddress();
        const sd6 = await Stablecoin6.getAddress();
        const s18 = await Stablecoin18.getAddress();

        {
          await Stablecoin6.connect(Signer(0)).mint(udd, Amount(100, 6));
        }

        {
          const txn = UVX.connect(Signer(3)).lend(rdd, sd6, s18, Amount(100, 6));

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientBalance");
        }
      });
    });
  });
});
