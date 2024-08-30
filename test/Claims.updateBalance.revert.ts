import { Claim } from "./src/Claim";
import { CreatePropose16Expired } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

const MAX = maxUint256;

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("revert", function () {
      it("if updating balances twice", async function () {
        const { Address, Claims, Signer } = await loadFixture(CreatePropose16Expired);

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
          Claim(7),
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
    });
  });
});
