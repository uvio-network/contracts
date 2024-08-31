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
import { UpdateBalancePunishEqualVotes } from "./src/Deploy";
import { UpdateBalancePunishNoVotes } from "./src/Deploy";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("punish", function () {
      describe("25 true", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1], 25);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(25),
            Side(true),
            EXPIRY,
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [0], // address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Side(false),
          );

          return { Address, Claims, Signer, Token };
        }

        const updateBalance = async () => {
          const { Address, Claims, Signer, Token } = await loadFixture(updateResolve);

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            1,
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(25)); // yay
          expect(res[1]).to.equal(Amount(0));  // nah

          expect(res[0] + res[1]).to.equal(Amount(25));
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
      });

      describe("25 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1], 25);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(25),
            Side(false),
            Expiry(2, "days"),
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [MAX], // address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
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
            1,
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(0)); // yay
          expect(res[1]).to.equal(Amount(25));  // nah

          expect(res[0] + res[1]).to.equal(Amount(25));
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
      });

      describe("one no vote", function () {
        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 25 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance25TrueNoVote);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(25)); // yay
          expect(res[1]).to.equal(0);          // nah

          expect(res[0] + res[1]).to.equal(Amount(25));
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
      });

      describe("all no votes", function () {
        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(30));  // nah

          expect(res[0] + res[1]).to.equal(Amount(50));
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
          expect(res[1]).to.equal(Amount(20.50)); // available (20.50 is 2 * 90% + protocol fee)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(11.50)); // available (11.50 is 90% of initial + proposer fee)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to no vote)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available (9.00 is 90% of initial)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to no vote)
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishNoVotes);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available (9.00 is 90% of initial)
        });
      });

      describe("all equal votes", function () {
        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 118 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(81)); // yay
          expect(res[1]).to.equal(Amount(37)); // nah

          expect(res[0] + res[1]).to.equal(Amount(118));
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
          expect(res[1]).to.equal(Amount(71.60)); // available (71.60 is 4 * 90% + protocol fee)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(5.90)); // available (proposer fee)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(40.50)); // available (40.50 is 90% of initial)
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalancePunishEqualVotes);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (lost it all due to equal vote)
        });
      });
    });
  });
});
