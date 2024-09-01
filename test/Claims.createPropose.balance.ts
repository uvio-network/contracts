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
  describe("createPropose", function () {
    describe("balance", function () {
      const updateBalance = async () => {
        const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

        await Balance([1, 3], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50),
          Side(true),
          EXPIRY,
          Claim(0),
        );

        await Claims.connect(Signer(3)).createPropose(
          Claim(1),
          Amount(50),
          Side(false),
          Expiry(0),
          Claim(0),
        );

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

        await Claims.connect(Signer(9)).createResolve(
          Claim(1),
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

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
        await network.provider.send("evm_mine");

        await Claims.connect(Signer(0)).updateBalance(
          Claim(1),
          100,
        );

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);         // allocated
          expect(res[1]).to.equal(Amount(5)); // available (protocol fees)
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);          // allocated
          expect(res[1]).to.equal(Amount(95)); // available (being right)
        }

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (being wrong)
        }

        expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(100));

        return { Address, Balance, Claims, Signer, Token };
      }

      it("should use 30 tokens of the available balance without token transfer", async function () {
        const { Address, Claims, Signer } = await loadFixture(updateBalance);

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(30),
          Side(true),
          Expiry(16, "days"),
          Claim(0),
        );

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(Amount(30)); // allocated
        expect(res[1]).to.equal(Amount(65)); // available
      });

      it("should use all of the available balance without token transfer", async function () {
        const { Address, Claims, Signer } = await loadFixture(updateBalance);

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(95),
          Side(true),
          Expiry(16, "days"),
          Claim(0),
        );

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(Amount(95)); // allocated
        expect(res[1]).to.equal(0);          // available
      });

      it("should require token transfer without sufficient available balance", async function () {
        const { Address, Balance, Claims, Signer, Token } = await loadFixture(updateBalance);

        // Signer 1 has 95 available tokens. Staking 96 tokens should fail on
        // the token contract level, because the token transfer reverts.
        {
          const txn = Claims.connect(Signer(1)).createPropose(
            Claim(47),
            Amount(96),
            Side(true),
            Expiry(16, "days"),
            Claim(0),
          );

          await expect(txn).to.be.revertedWithCustomError(Token, "ERC20InsufficientAllowance");
        }

        // Make sure the user has no token balance right now.
        {
          expect(await Token.balanceOf(Address(1))).to.equal(0);
        }

        // Mint and allow for the missing token.
        {
          await Balance([1], 1);
        }

        // Make sure the user got their 1 additional token.
        {
          expect(await Token.balanceOf(Address(1))).to.equal(Amount(1));
        }

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(96),
          Side(true),
          Expiry(16, "days"),
          Claim(0),
        );

        // Make sure the user has no token balance anymore, because it was sent
        // to the Claims contract.
        {
          expect(await Token.balanceOf(Address(1))).to.equal(0);
        }

        // The protocol has 5 tokens available, earned as fees. The user has now
        // 96 tokens available after proposing the claim above. The Claims
        // contract itself should now own 101 tokens.
        {
          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(101));
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(Amount(96)); // allocated
          expect(res[1]).to.equal(0);          // available
        }
      });
    });
  });
});
