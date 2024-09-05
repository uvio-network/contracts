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
  describe("updateBalance", function () {
    describe("multiple", function () {
      describe("30 true 20 false, no overlap", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5], 10);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            EXPIRY,
          );
          await Claims.connect(Signer(2)).updatePropose(
            Claim(1),
            Amount(10),
            Side(false),
          );

          await Claims.connect(Signer(3)).updatePropose(
            Claim(1),
            Amount(10),
            Side(true),
          );
          await Claims.connect(Signer(4)).updatePropose(
            Claim(1),
            Amount(10),
            Side(true),
          );
          await Claims.connect(Signer(5)).updatePropose(
            Claim(1),
            Amount(10),
            Side(true),
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            [0, MAX], // address 3 and 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(3)).updateResolve(
            Claim(1),
            Side(true),
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

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            2,
          );

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(false);

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            2,
          );

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(false);

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            1,
          );

          return { Address, Claims, Signer, UVX };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(30)); // yay
          expect(res[1]).to.equal(Amount(10)); // min
          expect(res[2]).to.equal(Amount(20)); // nah

          expect(res[0] + res[2]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const thr = await Claims.searchBalance(Address(3));
          const fou = await Claims.searchBalance(Address(4));
          const fiv = await Claims.searchBalance(Address(5));

          expect(zer[1] + one[1] + thr[1] + fou[1] + fiv[1]).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000018"); // available (2.50 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000000"); // available (2.50 proposer fees)
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
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });
      });

      describe("70 true 115 false, overlap", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            EXPIRY,
          );
          await Claims.connect(Signer(2)).updatePropose(
            Claim(1),
            Amount(20),
            Side(true),
          );
          await Claims.connect(Signer(3)).updatePropose(
            Claim(1),
            Amount(30),
            Side(true),
          );
          await Claims.connect(Signer(1)).updatePropose(
            Claim(1),
            Amount(10),
            Side(true),
          );

          await Claims.connect(Signer(4)).updatePropose(
            Claim(1),
            Amount(25),
            Side(false),
          );
          await Claims.connect(Signer(5)).updatePropose(
            Claim(1),
            Amount(30),
            Side(false),
          );
          await Claims.connect(Signer(6)).updatePropose(
            Claim(1),
            Amount(30),
            Side(false),
          );
          await Claims.connect(Signer(7)).updatePropose(
            Claim(1),
            Amount(20),
            Side(false),
          );
          await Claims.connect(Signer(8)).updatePropose(
            Claim(1),
            Amount(10),
            Side(false),
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            [0, MAX], // address 1 and 4
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Side(true),
          );

          await Claims.connect(Signer(4)).updateResolve(
            Claim(1),
            Side(true),
          );

          return { Address, Claims, Signer, UVX };
        }

        const updateBalance = async () => {
          const { Address, Claims, Signer, UVX } = await loadFixture(updateResolve);

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            3,
          );

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(false);

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            3,
          );

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(false);

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            8,
          );

          return { Address, Claims, Signer, UVX };
        }

        it("should record all votes", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([2, 0]);
        });

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(70));  // yay
          expect(res[1]).to.equal(Amount(10));  // min
          expect(res[2]).to.equal(Amount(115)); // nah

          expect(res[0] + res[2]).to.equal(Amount(185));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(185));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("9250000000000000104"); // available (9.25 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // available
          expect(res[1]).to.equal("56821428571428571399"); // available (56.82)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("47571428571428571399"); // available (47.57)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("71357142857142857098"); // available (71.36)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
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

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });
    });
  });
});
