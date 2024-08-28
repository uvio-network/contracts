import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("revert", function () {
      const updateResolve = async () => {
        const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 2, 3, 4, 5], 10);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          EXPIRY,
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          0,
        );

        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          0,
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [0, MAX], // address 1 and 3
          Expiry(7, "days"),
        );

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Side(true),
        );

        await Claims.connect(Signer(3)).updateResolve(
          Claim(1),
          Side(true),
        );

        return { Address, Claims, Signer, Token };
      }

      const updateBalance = async () => {
        const { Address, Claims, Signer, Token } = await loadFixture(updateResolve);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
        expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);

        return { Address, Claims, Signer, Token };
      }

      it("if updating balances twice", async function () {
        const { Claims, Signer } = await loadFixture(updateBalance);

        const txn = Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });
    });
  });
});
