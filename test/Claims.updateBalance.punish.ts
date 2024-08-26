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
      describe("25 true, wrong", function () {
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
            [Index(0)], // index 0 is address 1
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
            0,
            100,
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(false);
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
          expect(res[1]).to.equal("25000000000000000000"); // available (total stake from single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });

      describe("25 false, wrong", function () {
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
            [Index(0)], // index 0 is address 1
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
            0,
            100,
          );

          return { Address, Claims, Signer, Token };
        }

        it("should update balances by punishing users", async function () {
          const { Claims } = await loadFixture(updateBalance);

          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(true);
          expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(false);
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
          expect(res[1]).to.equal("25000000000000000000"); // available (total stake from single player)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(updateBalance);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });
    });
  });
});
