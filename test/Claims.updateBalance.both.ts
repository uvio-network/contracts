import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalanceBoth22True33False } from "./src/Deploy";
import { UpdateBalanceBoth44True17False } from "./src/Deploy";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("both", function () {
      describe("22 true 33 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalanceBoth22True33False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 55 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceBoth22True33False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(22)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(33)); // nah

          expect(res[0] + res[2]).to.equal(Amount(55));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth22True33False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(55));
        });

        it("should result in the Claims contract owning 55 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceBoth22True33False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(55));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth22True33False);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(33.00)); // available (all of nah staked)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth22True33False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(22.00)); // available (all of yay staked)
        });
      });

      describe("44 true 17 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalanceBoth44True17False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 61 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceBoth44True17False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(44)); // yay
          expect(res[1]).to.equal(Amount(17)); // min
          expect(res[2]).to.equal(Amount(17)); // nah

          expect(res[0] + res[2]).to.equal(Amount(61));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth44True17False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(61));
        });

        it("should result in the Claims contract owning 61 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceBoth44True17False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(61));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth44True17False);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(44.00)); // available (all of nah staked)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceBoth44True17False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(17.00)); // available (all of yay staked)
        });
      });
    });
  });
});
