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
import { UpdateBalance25TrueNoVote } from "./src/Deploy";
import { UpdateBalanceMaxDisputeEqualVotes } from "./src/Deploy";
import { UpdateBalanceMaxDisputeNoVotes } from "./src/Deploy";
import { UpdateBalancePunishEqualVotes } from "./src/Deploy";
import { UpdateBalancePunishNoVotes } from "./src/Deploy";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("punish", function () {
      describe("25 true", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

          await Balance([1], 25);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(25),
            Side(true),
            EXPIRY,
            "",
            [],
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            [0], // address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Side(false),
          );

          return { Address, Claims, Signer, UVX };
        }

        const updateBalance = async () => {
          const { Address, Claims, Signer, UVX } = await loadFixture(updateResolve);

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
          await network.provider.send("evm_mine");

          const txn = await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            1,
          );

          return { Address, Claims, Signer, txn, UVX };
        }

        it("should record all votes", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 1]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(25)); // yay
          expect(res[1]).to.equal(Amount(25)); // min
          expect(res[2]).to.equal(0);          // nah

          expect(res[0] + res[2]).to.equal(Amount(25));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(25));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (total stake from single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("25000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, txn } = await loadFixture(updateBalance);

          await expect(txn).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 1, 0, 1, Amount(25));
        });
      });

      describe("25 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

          await Balance([1], 25);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(25),
            Side(false),
            Expiry(2, "days"),
            "",
            [],
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            [MAX], // address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Side(true),
          );

          return { Address, Claims, Signer, UVX };
        }

        const updateBalance = async () => {
          const { Address, Claims, Signer, UVX } = await loadFixture(updateResolve);

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
          await network.provider.send("evm_mine");

          const txn = await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            1,
          );

          return { Address, Claims, Signer, txn, UVX };
        }

        it("should record all votes", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([1, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(0);          // yay
          expect(res[1]).to.equal(Amount(25)); // min
          expect(res[2]).to.equal(Amount(25)); // nah

          expect(res[0] + res[2]).to.equal(Amount(25));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(25));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (total stake from single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("25000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, txn } = await loadFixture(updateBalance);

          await expect(txn).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 1, 1, 0, Amount(25));
        });
      });

      describe("one no vote", function () {
        it("should record all votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(25)); // yay
          expect(res[1]).to.equal(Amount(25)); // min
          expect(res[2]).to.equal(0);          // nah

          expect(res[0] + res[2]).to.equal(Amount(25));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));

          expect(zer[1] + one[1]).to.equal(Amount(25));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(25.00)); // available (all of signer 1's stake)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (slashed for being lazy)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal("25000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, txn } = await loadFixture(UpdateBalance25TrueNoVote);

          await expect(txn).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 1, 0, 0, Amount(25));
        });
      });

      describe("all no votes", function () {
        it("should record all votes", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 0]);
        });

        it("should settle market with invalid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(30)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));
          const fiv = await Claims.searchBalance(Address(5));

          expect(zer[1] + one[1] + two[1] + thr[1] + fou[1] + fiv[1]).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(23.00)); // available (23.00 is 2 * 100% + 3 * 10%)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available (9.00 is 90% of initial, no proposer fee)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(10); // two staker on the true side

          expect(res[0]).to.equal("10000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("9000000000000000000");  // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to no vote)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(10); // two staker on the true side

          expect(res[5]).to.equal("10000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available (9.00 is 90% of initial)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three staker on the false side

          expect(res[10]).to.equal(0);                      // agreement       before
          expect(res[11]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[12]).to.equal(0);                      // agreement       after
          expect(res[13]).to.equal("9000000000000000000");  // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to no vote)
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three staker on the false side

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available (9.00 is 90% of initial)
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15); // three staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("10000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal("9000000000000000000");  // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, txn } = await loadFixture(UpdateBalancePunishNoVotes);

          await expect(txn).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 5, 0, 0, Amount(50));
        });
      });

      describe("all equal votes", function () {
        it("should record all votes", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([1, 1]);
        });

        it("should settle market with invalid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 118 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(81)); // yay
          expect(res[1]).to.equal(Amount(5));  // min
          expect(res[2]).to.equal(Amount(37)); // nah

          expect(res[0] + res[2]).to.equal(Amount(118));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));
          const fiv = await Claims.searchBalance(Address(5));

          expect(zer[1] + one[1] + two[1] + thr[1] + fou[1] + fiv[1]).to.equal(Amount(118));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(77.50)); // available (77.50 is 4 * 100% + 1 * 90%)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (proposer gets punished entirely too)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(10); // two staker on the false side

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("25000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(10); // two staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("12000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three staker on the true side

          expect(res[0]).to.equal("30000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(40.50)); // available (40.50 is 90% of initial)
        });

        it("should calculate histories accurately for signer 4", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three staker on the true side

          expect(res[5]).to.equal("45000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("40500000000000000000"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });

        it("should calculate histories accurately for signer 5", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15); // three staker on the true side

          expect(res[10]).to.equal("6000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                     // disagreement    before

          expect(res[12]).to.equal(0);                     // agreement       after
          expect(res[13]).to.equal(0);                     // disagreement    after

          expect(res[14]).to.equal(0);                     // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, tx1, tx2 } = await loadFixture(UpdateBalancePunishEqualVotes);

          // Here we do also test that the event BalanceUpdated is emitted on
          // each call to updateBalance.
          await expect(tx1).to.emit(Claims, "BalanceUpdated").withArgs(Claim(1));
          await expect(tx2).to.emit(Claims, "BalanceUpdated").withArgs(Claim(1));

          await expect(tx2).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 5, 1, 1, Amount(118));
        });
      });

      describe("max disputes, no votes", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
          expect(await Claims.searchVotes(Claim(101))).to.deep.equal([2, 0]);
          expect(await Claims.searchVotes(Claim(102))).to.deep.equal([0, 0]); // no votes
        });

        it("should settle market with invalid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          // the original claim
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);

          // the first dispute
          expect(await Claims.searchResolve(Claim(101), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(101), await Claims.CLAIM_BALANCE_S())).to.equal(true);

          // the second dispute
          expect(await Claims.searchResolve(Claim(102), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(102), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("claim should have 10 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(5)); // yay
          expect(res[1]).to.equal(Amount(5)); // min
          expect(res[2]).to.equal(Amount(5)); // nah

          expect(res[0] + res[2]).to.equal(Amount(10));
        });

        it("first dispute should have 30 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchPropose(Claim(101));

          expect(res[0]).to.equal(Amount(10)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(20)); // nah

          expect(res[0] + res[2]).to.equal(Amount(30));
        });

        it("second dispute should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchPropose(Claim(102));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(20)); // min
          expect(res[2]).to.equal(Amount(30)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked in claim and disputes", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));

          expect(zer[1] + one[1] + two[1]).to.equal(Amount(90));
        });

        it("should result in the Claims contract owning 90 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(90));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("90000000000000000000"); // available (90.00 all funds)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (nothing because of punishment)
        });

        it("should calculate histories accurately for signer 1, propose", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("5000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                     // disagreement    before

          expect(res[2]).to.equal(0);                     // agreement       after
          expect(res[3]).to.equal(0);                     // disagreement    after

          expect(res[4]).to.equal(0);                     // proposer fee
        });

        it("should calculate histories accurately for signer 1, first dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(101));
          const res = await Claims.searchHistory(Claim(101), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("10000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate histories accurately for signer 1, second dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(102));
          const res = await Claims.searchHistory(Claim(102), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("20000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (all slashed)
        });

        it("should calculate histories accurately for signer 2, propose", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                     // agreement       before
          expect(res[1]).to.equal("5000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                     // agreement       after
          expect(res[3]).to.equal(0);                     // disagreement    after

          expect(res[4]).to.equal(0);                     // proposer fee
        });

        it("should calculate histories accurately for signer 2, first dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(101));
          const res = await Claims.searchHistory(Claim(101), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("20000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate histories accurately for signer 2, second dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          const ind = await Claims.searchIndices(Claim(102));
          const res = await Claims.searchHistory(Claim(102), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("30000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, tx1, tx2, tx3 } = await loadFixture(UpdateBalanceMaxDisputeNoVotes);

          // Here we do also test that the order of updating balances within a
          // tree of disputed claims does not matter. The final consensus is
          // applied throughout the tree.
          await expect(tx1).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 2, 0, 0, Amount(10));
          await expect(tx2).to.emit(Claims, "DisputeSettled").withArgs(Claim(102), 2, 0, 0, Amount(50));
          await expect(tx3).to.emit(Claims, "DisputeSettled").withArgs(Claim(101), 2, 0, 0, Amount(30));
        });
      });

      describe("max disputes, equal votes", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
          expect(await Claims.searchVotes(Claim(101))).to.deep.equal([2, 0]);
          expect(await Claims.searchVotes(Claim(102))).to.deep.equal([1, 1]); // equal votes
        });

        it("should settle market with invalid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          // the original claim
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);

          // the first dispute
          expect(await Claims.searchResolve(Claim(101), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(101), await Claims.CLAIM_BALANCE_S())).to.equal(true);

          // the second dispute
          expect(await Claims.searchResolve(Claim(102), await Claims.CLAIM_BALANCE_V())).to.equal(false);
          expect(await Claims.searchResolve(Claim(102), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("claim should have 10 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(5)); // yay
          expect(res[1]).to.equal(Amount(5)); // min
          expect(res[2]).to.equal(Amount(5)); // nah

          expect(res[0] + res[2]).to.equal(Amount(10));
        });

        it("first dispute should have 30 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchPropose(Claim(101));

          expect(res[0]).to.equal(Amount(10)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(20)); // nah

          expect(res[0] + res[2]).to.equal(Amount(30));
        });

        it("second dispute should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchPropose(Claim(102));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(20)); // min
          expect(res[2]).to.equal(Amount(30)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked in claim and disputes", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));

          expect(zer[1] + one[1] + two[1]).to.equal(Amount(90));
        });

        it("should result in the Claims contract owning 90 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(90));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("90000000000000000000"); // available (90.00 all funds)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (nothing because of punishment)
        });

        it("should calculate histories accurately for signer 1, propose", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("5000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                     // disagreement    before

          expect(res[2]).to.equal(0);                     // agreement       after
          expect(res[3]).to.equal(0);                     // disagreement    after

          expect(res[4]).to.equal(0);                     // proposer fee
        });

        it("should calculate histories accurately for signer 1, first dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(101));
          const res = await Claims.searchHistory(Claim(101), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("10000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate histories accurately for signer 1, second dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(102));
          const res = await Claims.searchHistory(Claim(102), ind[1], ind[2]);

          expect(res.length).to.equal(5); // one staker on the true side

          expect(res[0]).to.equal("20000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (all slashed)
        });

        it("should calculate histories accurately for signer 2, propose", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                     // agreement       before
          expect(res[1]).to.equal("5000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                     // agreement       after
          expect(res[3]).to.equal(0);                     // disagreement    after

          expect(res[4]).to.equal(0);                     // proposer fee
        });

        it("should calculate histories accurately for signer 2, first dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(101));
          const res = await Claims.searchHistory(Claim(101), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("20000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate histories accurately for signer 2, second dispute", async function () {
          const { Claims } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          const ind = await Claims.searchIndices(Claim(102));
          const res = await Claims.searchHistory(Claim(102), ind[5], ind[6]);

          expect(res.length).to.equal(5); // one staker on the false side

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("30000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should emit event", async function () {
          const { Claims, tx1, tx2, tx3 } = await loadFixture(UpdateBalanceMaxDisputeEqualVotes);

          await expect(tx1).to.emit(Claims, "DisputeSettled").withArgs(Claim(102), 2, 1, 1, Amount(50));
          await expect(tx2).to.emit(Claims, "DisputeSettled").withArgs(Claim(101), 2, 1, 1, Amount(30));
          await expect(tx3).to.emit(Claims, "ProposeSettled").withArgs(Claim(1), 2, 1, 1, Amount(10));
        });
      });
    });
  });
});
