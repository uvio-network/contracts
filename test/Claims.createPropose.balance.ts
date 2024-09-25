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
        const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

        await Balance([1, 3], 50);

        await Claims.connect(Signer(1)).createPropose(
          Claim(1),
          Amount(50.00),
          Side(true),
          EXPIRY,
          "",
          [],
        );

        await Claims.connect(Signer(3)).updatePropose(
          Claim(1),
          Amount(50.00),
          Side(false),
          0,
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

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(2.50)); // available (protocol fees)
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(97.50)); // available (being right)
        }

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (being wrong)
        }

        expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(100));

        return { Address, Balance, Claims, Signer, UVX };
      }

      it("should use 30 tokens of the available balance without token transfer", async function () {
        const { Address, Claims, Signer } = await loadFixture(updateBalance);

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(30),
          Side(true),
          Expiry(16, "days"),
          "",
          [],
        );

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(Amount(30.00)); // allocated
        expect(res[1]).to.equal(Amount(67.50)); // available
      });

      it("should use all of the available balance without token transfer", async function () {
        const { Address, Claims, Signer } = await loadFixture(updateBalance);

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(97.50),
          Side(true),
          Expiry(16, "days"),
          "",
          [],
        );

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(Amount(97.50)); // allocated
        expect(res[1]).to.equal(0);             // available
      });

      it("should require token transfer without sufficient available balance", async function () {
        const { Address, Balance, Claims, Signer, UVX } = await loadFixture(updateBalance);

        // Signer 1 has 97.50 available tokens. Staking 97.51 tokens should fail
        // on the token contract level, because the token transfer reverts.
        {
          const txn = Claims.connect(Signer(1)).createPropose(
            Claim(47),
            Amount(97.51),
            Side(true),
            Expiry(16, "days"),
            "",
            [],
          );

          await expect(txn).to.be.revertedWithCustomError(UVX, "ERC20InsufficientAllowance");
        }

        // Make sure the user has no token balance right now.
        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        // Mint and allow for the missing tokens.
        {
          await Balance([1], 0.01);
        }

        // Make sure the user got their additional tokens.
        {
          expect(await UVX.balanceOf(Address(1))).to.equal(Amount(0.01));
        }

        await Claims.connect(Signer(1)).createPropose(
          Claim(47),
          Amount(97.51),
          Side(true),
          Expiry(16, "days"),
          "",
          [],
        );

        // Make sure the user has no token balance anymore, because it was sent
        // to the Claims contract.
        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        // The protocol has 2.50 tokens available, earned as fees. The user has now
        // 97.51 tokens allocated after proposing the claim above. The Claims
        // contract itself should now own 100.01 tokens.
        {
          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(100.01));
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(Amount(97.51)); // allocated
          expect(res[1]).to.equal(0);             // available
        }
      });
    });
  });
});
