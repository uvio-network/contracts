import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { ResolveDispute20True30False } from "./src/Deploy";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("dispute", function () {
      describe("22 true 30 false, resolve dispute", function () {
        // Here we show that the balances calculated change according to the
        // flipped votes. The version with the balances updated based on true
        // votes can be found in test/Claims.updateBalance.reward.ts where we
        // use the fixture UpdateBalance20True30False.
        const updateBalance = async () => {
          const { Address, Claims, Signer, Token } = await loadFixture(ResolveDispute20True30False);

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(29, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            100,
          );

          await Claims.connect(Signer(0)).updateBalance(
            Claim(13),
            100,
          );

          return { Address, Claims, Signer, Token };
        };

        it("should flip votes", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
          expect(await Claims.searchVotes(Claim(13))).to.deep.equal([0, 2]);
        });

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          // the original claim
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);

          // the dispute
          expect(await Claims.searchResolve(Claim(13), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(13), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(13), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("claim should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(30)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("dispute should have 325 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(13));

          expect(res[0]).to.equal(Amount(160)); // yay
          expect(res[1]).to.equal(Amount(20));  // min
          expect(res[2]).to.equal(Amount(165)); // nah

          expect(res[0] + res[2]).to.equal(Amount(325));
        });

        it("should calculate available balances according to tokens staked in claim and dispute", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));
          const fiv = await Claims.searchBalance(Address(5));
          const six = await Claims.searchBalance(Address(6));
          const sev = await Claims.searchBalance(Address(7));
          const eig = await Claims.searchBalance(Address(8));

          expect(zer[1] + one[1] + two[1] + thr[1] + fou[1] + fiv[1] + six[1] + sev[1] + eig[1]).to.equal(Amount(375));
        });

        it("should result in the Claims contract owning 375 tokens", async function () {
          const { Claims, Token } = await loadFixture(updateBalance);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(375));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("18750000000000000162"); // available (18.75 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000000"); // available (2.50)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("31249999999999999994"); // available (31.25)
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("88636363636363636320"); // available (88.64)
        });

        it("should calculate balances accurately for signer 7", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(7));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 8", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(8));

          expect(res[0]).to.equal(0);                       // allocated
          expect(res[1]).to.equal("203863636363636363536"); // available (203.87)
        });
      });
    });
  });
});
