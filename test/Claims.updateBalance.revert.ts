import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

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
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(2)).createPropose(
          Claim(1),
          Amount(10),
          Side(true),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(4)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );
        await Claims.connect(Signer(5)).createPropose(
          Claim(1),
          Amount(10),
          Side(false),
          Expiry(2, "days"),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

        await Claims.connect(Signer(7)).createResolve(
          Claim(1),
          Claim(7),
          [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
          Expiry(7, "days"),
        );

        await Claims.connect(Signer(1)).updateResolve(
          Claim(1),
          Claim(7),
          Side(true),
        );

        await Claims.connect(Signer(5)).updateResolve(
          Claim(1),
          Claim(7),
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
          Claim(7),
          0,
          100,
        );

        return { Address, Claims, Signer, Token };
      }

      it("if updating balances twice", async function () {
        const { Claims, Signer } = await loadFixture(updateBalance);

        const txn = Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          Claim(7),
          0,
          100,
        );

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });
    });
  });
});
