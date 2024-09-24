import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalanceSingle35TrueLose, UpdateBalanceSingle42FalseLose } from "./src/Deploy";
import { UpdateBalanceSingle35TrueWin } from "./src/Deploy";
import { UpdateBalanceSingle42FalseWin } from "./src/Deploy";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("single", function () {
      describe("35 true, lose", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 1]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 35 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(35)); // yay
          expect(res[1]).to.equal(Amount(5));  // min
          expect(res[2]).to.equal(0);          // nah

          expect(res[0] + res[2]).to.equal(Amount(35));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(35));
        });

        it("should result in the Claims contract owning 35 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceSingle35TrueLose);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(35));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(33.25)); // available (everything minus proposer fee)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(1.75)); // available (proposer fee)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[0]).to.equal("12000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal("1750000000000000000");  // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[5]).to.equal("14000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[10]).to.equal("9000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                     // disagreement    before

          expect(res[12]).to.equal(0);                     // agreement       after
          expect(res[13]).to.equal(0);                     // disagreement    after

          expect(res[14]).to.equal(0);                     // proposer fee
        });
      });

      describe("35 true, win", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([1, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 35 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(35)); // yay
          expect(res[1]).to.equal(Amount(5));  // min
          expect(res[2]).to.equal(0);          // nah

          expect(res[0] + res[2]).to.equal(Amount(35));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(35));
        });

        it("should result in the Claims contract owning 35 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceSingle35TrueWin);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(35));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (nothing because there are no rewards to be distributed)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(12.00)); // available (5.00 + 7.00)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[0]).to.equal("12000000000000000000"); // agreement       before
          expect(res[1]).to.equal(0);                      // disagreement    before

          expect(res[2]).to.equal("12000000000000000000"); // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(14.00)); // available (6.00 + 8.00)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[5]).to.equal("14000000000000000000"); // agreement       before
          expect(res[6]).to.equal(0);                      // disagreement    before

          expect(res[7]).to.equal("14000000000000000000"); // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(9.00)); // available
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle35TrueWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[1], ind[2]);

          expect(res.length).to.equal(15);

          expect(res[10]).to.equal("9000000000000000000"); // agreement       before
          expect(res[11]).to.equal(0);                      // disagreement    before

          expect(res[12]).to.equal("9000000000000000000"); // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });
      });

      describe("42 false, lose", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([1, 0]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 42 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(0);          // yay
          expect(res[1]).to.equal(Amount(3));  // min
          expect(res[2]).to.equal(Amount(42)); // nah

          expect(res[0] + res[2]).to.equal(Amount(42));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(42));
        });

        it("should result in the Claims contract owning 42 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceSingle42FalseLose);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(42));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("39900000000000000000"); // available (everything minus proposer fee)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(2.10)); // available (proposer fee)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[10]).to.equal(0);                      // agreement       before
          expect(res[11]).to.equal("15000000000000000000"); // disagreement    before

          expect(res[12]).to.equal(0);                      // agreement       after
          expect(res[13]).to.equal(0);                      // disagreement    after

          expect(res[14]).to.equal("2100000000000000000");  // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("11000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal(0);                      // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseLose);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("16000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal(0);                      // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });

      describe("42 false, win", function () {
        it("should track votes", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 1]);
        });

        it("should settle market with valid resolution", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_V())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_S())).to.equal(true);
        });

        it("should have 42 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(0);          // yay
          expect(res[1]).to.equal(Amount(3));  // min
          expect(res[2]).to.equal(Amount(42)); // nah

          expect(res[0] + res[2]).to.equal(Amount(42));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(42));
        });

        it("should result in the Claims contract owning 42 tokens", async function () {
          const { Claims, UVX } = await loadFixture(UpdateBalanceSingle42FalseWin);

          expect(await UVX.balanceOf(await Claims.getAddress())).to.equal(Amount(42));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available (nothing because there are no rewards to be distributed)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(15.00)); // available (3.00 + 7.00 + 5.00)
        });

        it("should calculate histories accurately for signer 1", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[10]).to.equal(0);                      // agreement       before
          expect(res[11]).to.equal("15000000000000000000"); // disagreement    before

          expect(res[12]).to.equal(0);                      // agreement       after
          expect(res[13]).to.equal("15000000000000000000"); // disagreement    after

          expect(res[14]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(11.00)); // available (6.00 + 5.00)
        });

        it("should calculate histories accurately for signer 2", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[5]).to.equal(0);                      // agreement       before
          expect(res[6]).to.equal("11000000000000000000"); // disagreement    before

          expect(res[7]).to.equal(0);                      // agreement       after
          expect(res[8]).to.equal("11000000000000000000"); // disagreement    after

          expect(res[9]).to.equal(0);                      // proposer fee
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(16.00)); // available (8.00 + 8.00)
        });

        it("should calculate histories accurately for signer 3", async function () {
          const { Claims } = await loadFixture(UpdateBalanceSingle42FalseWin);

          const ind = await Claims.searchIndices(Claim(1));
          const res = await Claims.searchHistory(Claim(1), ind[5], ind[6]);

          expect(res.length).to.equal(15);

          expect(res[0]).to.equal(0);                      // agreement       before
          expect(res[1]).to.equal("16000000000000000000"); // disagreement    before

          expect(res[2]).to.equal(0);                      // agreement       after
          expect(res[3]).to.equal("16000000000000000000"); // disagreement    after

          expect(res[4]).to.equal(0);                      // proposer fee
        });
      });
    });
  });
});
