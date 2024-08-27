import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("reward", function () {
      describe("25 true", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1], 25);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(25),
            Side(true),
            Expiry(2, "days"),
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [Index(+1)], // index +1 is address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(+1),
            Index(+1),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          expect(res[1]).to.equal(0); // available (no service fee for single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
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
            [Index(-1)], // index -1 is address 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(-1),
            Index(-1),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          expect(res[1]).to.equal(0); // available (no service fee for single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
        });
      });

      describe("20 true 30 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5], 10);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            Expiry(2, "days"),
          );
          await Claims.connect(Signer(2)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            0,
          );

          await Claims.connect(Signer(3)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            0,
          );
          await Claims.connect(Signer(4)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            0,
          );
          await Claims.connect(Signer(5)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            0,
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [Index(+1), Index(-1)], // index +1 and -1 are address 1 and 3
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
            Side(true),
          );

          await Claims.connect(Signer(3)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(+1),
            Index(+2),
          );

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            Claim(7),
            Index(-3),
            Index(-1),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(20)); // yay
          expect(res[1]).to.equal(Amount(30)); // nah

          expect(res[0] + res[1]).to.equal(Amount(50));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));

          expect(zer[1] + one[1] + two[1]).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000000"); // available (2.50)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("22500000000000000000"); // available (22.50)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
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
      });

      describe("30 true 20 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5], 10);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            Expiry(2, "days"),
          );
          await Claims.connect(Signer(2)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            0,
          );

          await Claims.connect(Signer(3)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            0,
          );
          await Claims.connect(Signer(4)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            0,
          );
          await Claims.connect(Signer(5)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            0,
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [Index(+1), Index(-1)], // index +1 and -1 are address 1 and 3
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
            Side(true),
          );

          await Claims.connect(Signer(3)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(-2),
            Index(-1),
          );

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(false);

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            Claim(7),
            Index(+1),
            Index(+3),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 50 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(30)); // yay
          expect(res[1]).to.equal(Amount(20)); // nah

          expect(res[0] + res[1]).to.equal(Amount(50));
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

      describe("70 true 115 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            Expiry(2, "days"),
          );
          await Claims.connect(Signer(2)).createPropose(
            Claim(1),
            Amount(20),
            Side(true),
            0,
          );
          await Claims.connect(Signer(3)).createPropose(
            Claim(1),
            Amount(30),
            Side(true),
            0,
          );
          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(10),
            Side(true),
            Expiry(2, "days"),
          );

          await Claims.connect(Signer(4)).createPropose(
            Claim(1),
            Amount(25),
            Side(false),
            0,
          );
          await Claims.connect(Signer(5)).createPropose(
            Claim(1),
            Amount(30),
            Side(false),
            0,
          );
          await Claims.connect(Signer(6)).createPropose(
            Claim(1),
            Amount(30),
            Side(false),
            0,
          );
          await Claims.connect(Signer(7)).createPropose(
            Claim(1),
            Amount(20),
            Side(false),
            0,
          );
          await Claims.connect(Signer(8)).createPropose(
            Claim(1),
            Amount(10),
            Side(false),
            0,
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [Index(+1), Index(-1)], // index +1 and -1 are address 1 and 4
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
            Side(true),
          );

          await Claims.connect(Signer(4)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(+1),
            Index(+3),
          );

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            Claim(7),
            Index(-5),
            Index(-1),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(70));  // yay
          expect(res[1]).to.equal(Amount(115)); // nah

          expect(res[0] + res[1]).to.equal(Amount(185));
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

      describe("12,550,000,000,000 true 46,000,500 false", function () {
        const updateResolve = async () => {
          const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

          await Balance([1, 2, 3, 4, 5, 6, 7, 8], 10_000_000_000_000);

          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(300),
            Side(false),
            Expiry(2, "days"),
          );
          await Claims.connect(Signer(2)).createPropose(
            Claim(1),
            Amount(25_000_000),
            Side(false),
            0,
          );
          await Claims.connect(Signer(3)).createPropose(
            Claim(1),
            Amount(1_000_000),
            Side(false),
            0,
          );
          await Claims.connect(Signer(1)).createPropose(
            Claim(1),
            Amount(20_000_200),
            Side(false),
            Expiry(2, "days"),
          );

          await Claims.connect(Signer(4)).createPropose(
            Claim(1),
            Amount(10_000_000_000_000),
            Side(true),
            0,
          );
          await Claims.connect(Signer(5)).createPropose(
            Claim(1),
            Amount(2_000_000_000_000),
            Side(true),
            0,
          );
          await Claims.connect(Signer(6)).createPropose(
            Claim(1),
            Amount(500_000_000_000),
            Side(true),
            0,
          );
          await Claims.connect(Signer(7)).createPropose(
            Claim(1),
            Amount(20_000_000_000),
            Side(true),
            0,
          );
          await Claims.connect(Signer(8)).createPropose(
            Claim(1),
            Amount(30_000_000_000),
            Side(true),
            0,
          );

          await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
          await network.provider.send("evm_mine");

          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

          await Claims.connect(Signer(7)).createResolve(
            Claim(1),
            Claim(7),
            [Index(+1), Index(-1)], // index +1 and -1 are address 4 and 1
            Expiry(7, "days"),
          );

          await Claims.connect(Signer(4)).updateResolve(
            Claim(1),
            Claim(7),
            Side(false),
          );

          await Claims.connect(Signer(1)).updateResolve(
            Claim(1),
            Claim(7),
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
            Claim(7),
            Index(+1),
            Index(+5),
          );

          await Claims.connect(Signer(0)).updateBalance(
            Claim(1),
            Claim(7),
            Index(-3),
            Index(-1),
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(12_550_000_000_000)); // yay
          expect(res[1]).to.equal(Amount(46_000_500));         // nah

          expect(res[0] + res[1]).to.equal(Amount(12_550_046_000_500));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(12_550_046_000_500));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("627502300025000022590000000000"); // available (627,502,300,025.00 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("5538459257660247977435000000000"); // available (5,538,459,257,660.25 + proposer fee)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("6138542733475723079940000000000"); // available (6,138,542,733,475.72)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("245541709339028920035000000000"); // available (245,541,709,339.03)
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
