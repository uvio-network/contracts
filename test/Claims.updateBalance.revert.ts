import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { CreatePropose16Expired } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { ResolveDispute20True30False } from "./src/Deploy";
import { Role } from "./src/Role";
import { Side } from "./src/Side";
import { UpdateDispute20True30False } from "./src/Deploy";
import { UpdateResolve20True30False } from "./src/Deploy";

const MAX = maxUint256;

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("revert", function () {
      it("if updating balances twice", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          [0, MAX], // address 1 and 9
          Expiry(7, "days"),
        );

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        await Claims.connect(Signer(9)).updateResolve(
          Claim(1),
          Side(true),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
        await network.provider.send("evm_mine");

        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(false);

        await Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);

        const txn = Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if dispute created", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          Claim(1),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge period
        await network.provider.send("evm_mine");

        const txn = Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
      });

      it("if dispute active", async function () {
        const { Claims, Signer } = await loadFixture(UpdateDispute20True30False);

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(13),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }
      });

      it("if dispute challenge, started", async function () {
        const { Claims, Signer } = await loadFixture(ResolveDispute20True30False);

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(13),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }
      });

      it("if dispute challenge, before end", async function () {
        const { Claims, Signer } = await loadFixture(ResolveDispute20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(28, "days")]);
        await network.provider.send("evm_mine");

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }

        {
          const txn = Claims.connect(Signer(0)).updateBalance(
            Claim(13),
            100,
          );

          await expect(txn).to.be.revertedWithCustomError(Claims, "Expired");
        }
      });
    });
  });
});
