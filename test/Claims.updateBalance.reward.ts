import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalance25False } from "./src/Deploy";
import { UpdateBalance25True } from "./src/Deploy";
import { UpdateBalance20True30False } from "./src/Deploy";
import { UpdateBalance30True20False } from "./src/Deploy";
import { UpdateBalance59True126False } from "./src/Deploy";
import { UpdateBalance12TTrue46MFalse } from "./src/Deploy";
import { UpdateBalanceSingle36True10000False } from "./src/Deploy";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("reward", function () {
      describe("25 true", function () {
        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance25True);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance25True);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(25)); // yay
          expect(res[1]).to.equal(Amount(25)); // min
          expect(res[2]).to.equal(0);          // nah

          expect(res[0] + res[2]).to.equal(Amount(25));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25True);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(25));
        });

        it("should result in the Claims contract owning 25 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance25True);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(25));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25True);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (no service fee for single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25True);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance25True);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(5);

          expect(res[0]).to.equal("25000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("25000000000000000000"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });

      describe("25 false", function () {
        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance25False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance25False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(0);          // yay
          expect(res[1]).to.equal(Amount(25)); // min
          expect(res[2]).to.equal(Amount(25)); // nah

          expect(res[0] + res[2]).to.equal(Amount(25));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(25));
        });

        it("should result in the Claims contract owning 25 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance25False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(25));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25False);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (no service fee for single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance25False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(5);

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("25000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal("25000000000000000000"); // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });

      describe("20 true 30 false", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(30)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));

          expect(zer[1] + one[1] + two[1]).to.equal(Amount(50));
        });

        it("should result in the Claims contract owning 50 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance20True30False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("1500000000000000000"); // available (1.50 is 5% of 30.00)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00 is 1.50 proposer fee + 50% of 27)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(10); // two stakers on the true side

          expect(res[0]).to.equal("10000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("23500000000000000000"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal("1500000000000000000"); // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("23500000000000000000"); // available (23.50)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(10); // two stakers on the true side

          expect(res[5]).to.equal("10000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("23500000000000000000"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          // Note that the indices for stakers on the false side are reversed,
          // which is why the last indices of the index tuple belong to the
          // first staker.

          expect(res[10]).to.equal(0);                      // agreement       before
          expect(res[11]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[12]).to.equal(0);                      // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });

      describe("30 true 20 false", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(30)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(20)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));
          const fiv = await Claims.searchBalance(Address(5));

          expect(zer[1] + one[1] + thr[1] + fou[1] + fiv[1]).to.equal(Amount(50));
        });

        it("should result in the Claims contract owning 50 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance30True20False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("1000000000000000018"); // available (1.00 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("1000000000000000000"); // available (1.00 proposer fees)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(10); // two stakers on the false side

          // Note that the indices for stakers on the false side are reversed,
          // which is why the last indices of the index tuple belong to the
          // first staker.

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal("1000000000000000000");  // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(10); // two stakers on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available (16.00)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[0]).to.equal("10000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("15999999999999999994"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available (16.00)
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[5]).to.equal("10000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("15999999999999999994"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available (16.00)
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[10]).to.equal("10000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                      // disagreement    before

          expect(res[12]).to.equal("15999999999999999994"); // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });
      });

      describe("70 true 115 false", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(59));  // yay
          expect(res[1]).to.equal(Amount(10));  // min
          expect(res[2]).to.equal(Amount(126)); // nah

          expect(res[0] + res[2]).to.equal(Amount(185));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(185));
        });

        it("should result in the Claims contract owning 185 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance59True126False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(185));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("6300000000000000115"); // available (6.30 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // available
          expect(res[1]).to.equal("64740677966101694901"); // available (64.74 is initial 20.00 + proposer fee + rewards)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[0]).to.equal("20000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("58440677966101694901"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal("6300000000000000000");  // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("58440677966101694901"); // available (58.44)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[5]).to.equal("20000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("58440677966101694901"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("55518644067796610083"); // available (55.52)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[10]).to.equal("19000000000000000000"); // agreement       before
          expect(res[11]).to.equal("11000000000000000000"); // disagreement    before

          expect(res[12]).to.equal("55518644067796610083"); // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(25); // five stakers on the false side

          expect(res[20]).to.equal(0);                      // agreement       before
          expect(res[21]).to.equal("25000000000000000000"); // disagreement    before

          expect(res[22]).to.equal(0);                      // agreement       after
          expect(res[23]).to.equal(0);                      // disagreement    after

          expect(res[24]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(25); // five stakers on the false side

          expect(res[15]).to.equal(0);                      // agreement       before
          expect(res[16]).to.equal("30000000000000000000"); // disagreement    before

          expect(res[17]).to.equal(0);                      // agreement       after
          expect(res[18]).to.equal(0);                      // disagreement    after

          expect(res[19]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 6", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(25); // five stakers on the false side

          expect(res[10]).to.equal(0);                      // agreement       before
          expect(res[11]).to.equal("30000000000000000000"); // disagreement    before

          expect(res[12]).to.equal(0);                      // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 7", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(7));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 7", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(25); // five stakers on the false side

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("20000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 8", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance59True126False);

          const res = await Claims.searchBalance(Address(8));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 8", async function () {
          const { Claims } = await loadFixture(UpdateBalance59True126False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(25); // five stakers on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });

      describe("12,550,000,000,000 true 46,000,500 false", function () {
        it("should record all votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 2]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(12_550_000_000_000)); // yay
          expect(res[1]).to.equal(Amount(300));                // min
          expect(res[2]).to.equal(Amount(46_000_500));         // nah

          expect(res[0] + res[2]).to.equal(Amount(12_550_046_000_500));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(12_550_046_000_500));
        });

        it("should result in the Claims contract owning 185 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(12_550_046_000_500));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("627500000000000022590000000000"); // available (627,000,000,000.00 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("5538458957685247977435000000000"); // available (5,538,458,957,685.25 inclusive proposer fee)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          expect(res[10]).to.equal(0);                                 // agreement       before
          expect(res[11]).to.equal("20000500000000000000000000");      // disagreement    before

          expect(res[12]).to.equal(0);                                 // agreement       after
          expect(res[13]).to.equal("4910958957685247977435000000000"); // disagreement    after

          expect(res[14]).to.equal("627500000000000000000000000000");  // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("6138545233475723079940000000000"); // available (6,138,545,233,475.72)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          expect(res[5]).to.equal(0);                                 // agreement       before
          expect(res[6]).to.equal("25000000000000000000000000");      // disagreement    before

          expect(res[7]).to.equal(0);                                 // agreement       after
          expect(res[8]).to.equal("6138545233475723079940000000000"); // disagreement    after

          expect(res[9]).to.equal(0);                                 // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("245541809339028920035000000000"); // available (245,541,809,339.03)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three stakers on the false side

          expect(res[0]).to.equal(0);                                // agreement       before
          expect(res[1]).to.equal("1000000000000000000000000");      // disagreement    before

          expect(res[2]).to.equal(0);                                // agreement       after
          expect(res[3]).to.equal("245541809339028920035000000000"); // disagreement    after

          expect(res[4]).to.equal(0);                                // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(25); // five stakers on the true side

          expect(res[0]).to.equal("10000000000000000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                                  // disagreement    before

          expect(res[2]).to.equal(0);                                  // agreement       after
          expect(res[3]).to.equal(0);                                  // disagreement    after

          expect(res[4]).to.equal(0);                                  // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(25); // five stakers on the true side

          expect(res[5]).to.equal("2000000000000000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                                 // disagreement    before

          expect(res[7]).to.equal(0);                                 // agreement       after
          expect(res[8]).to.equal(0);                                 // disagreement    after

          expect(res[9]).to.equal(0);                                 // proposer fee
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 6", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(25); // five stakers on the true side

          expect(res[10]).to.equal("500000000000000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                                // disagreement    before

          expect(res[12]).to.equal(0);                                // agreement       after
          expect(res[13]).to.equal(0);                                // disagreement    after

          expect(res[14]).to.equal(0);                                // proposer fee
        });

        it("should calculate balances accurately for signer 7", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(7));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 7", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(25); // five stakers on the true side

          expect(res[15]).to.equal("20000000000000000000000000000"); // agreement       before
          expect(res[16]).to.equal(0);                               // disagreement    before

          expect(res[17]).to.equal(0);                               // agreement       after
          expect(res[18]).to.equal(0);                               // disagreement    after

          expect(res[19]).to.equal(0);                               // proposer fee
        });

        it("should calculate balances accurately for signer 8", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(8));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 8", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(25); // five stakers on the true side

          expect(res[20]).to.equal("30000000000000000000000000000"); // agreement       before
          expect(res[21]).to.equal(0);                               // disagreement    before

          expect(res[22]).to.equal(0);                               // agreement       after
          expect(res[23]).to.equal(0);                               // disagreement    after

          expect(res[24]).to.equal(0);                               // proposer fee
        });
      });

      describe("Amount(36) true 10,000 false", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([1, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 36_000_000_000_000_010_000 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(36)); // yay
          expect(res[1]).to.equal(10_000);     // min
          expect(res[2]).to.equal(10_000);     // nah

          expect(res[0] + res[2]).to.equal("36000000000000010000");
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));

          expect(zer[1] + one[1] + two[1] + thr[1] + fou[1]).to.equal("36000000000000010000");
        });

        it("should result in the Claims contract owning 36_000_000_000_000_010_000 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceSingle36True10000False);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal("36000000000000010000");
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);     // allocated
          expect(res[1]).to.equal("502"); // available (502 is 5% of 10,000 plus precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("12000000000000002999"); // available (initial + 30% of 10,000)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[0]).to.equal("12000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("12000000000000002999"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("15000000000000003749"); // available (15.00 + reward of 10,000)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[5]).to.equal("15000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("15000000000000003749"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("9000000000000002250"); // available (9.00 + reward of 10,000)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three stakers on the true side

          expect(res[10]).to.equal("9000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                      // disagreement    before

          expect(res[12]).to.equal("9000000000000002250"); // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);     // allocated
          expect(res[1]).to.equal("500"); // available (proposer fee)
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle36True10000False);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);        // agreement       before
          expect(res[1]).to.equal("10000"); // disagreement    before

          expect(res[2]).to.equal(0);        // agreement       after
          expect(res[3]).to.equal(0);        // disagreement    after

          expect(res[4]).to.equal("500");    // proposer fee
        });
      });
    });
  });
});
