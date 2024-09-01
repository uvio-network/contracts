import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalance25False } from "./src/Deploy";
import { UpdateBalance25True } from "./src/Deploy";
import { UpdateBalance20True30False } from "./src/Deploy";
import { UpdateBalance30True20False } from "./src/Deploy";
import { UpdateBalance70True115False } from "./src/Deploy";
import { UpdateBalance12TTrue46MFalse } from "./src/Deploy";

describe("Claims", function () {
  describe("updateBalance", function () {
    describe("reward", function () {
      describe("25 true", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance25True);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          const { Claims, Token } = await loadFixture(UpdateBalance25True);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(25));
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
      });

      describe("25 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance25False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          const { Claims, Token } = await loadFixture(UpdateBalance25False);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(25));
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
      });

      describe("20 true 30 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance20True30False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          const { Claims, Token } = await loadFixture(UpdateBalance20True30False);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000000"); // available (2.50)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("25000000000000000000"); // available (25.00)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("22500000000000000000"); // available (22.50)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance20True30False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });

      describe("30 true 20 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance30True20False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          const { Claims, Token } = await loadFixture(UpdateBalance30True20False);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(50));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000018"); // available (2.50 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("2500000000000000000"); // available (2.50 proposer fees)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance30True20False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("14999999999999999994"); // available (15.00)
        });
      });

      describe("70 true 115 false", function () {
        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance70True115False);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
        });

        it("should have 185 tokens staked", async function () {
          const { Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchPropose(Claim(1));

          expect(res[0]).to.equal(Amount(59));  // yay
          expect(res[1]).to.equal(Amount(10));  // min
          expect(res[2]).to.equal(Amount(126)); // nah

          expect(res[0] + res[2]).to.equal(Amount(185));
        });

        it("should calculate available balances according to tokens staked", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const zer = await Claims.searchBalance(Address(0));
          const one = await Claims.searchBalance(Address(1));
          const two = await Claims.searchBalance(Address(2));
          const thr = await Claims.searchBalance(Address(3));

          expect(zer[1] + one[1] + two[1] + thr[1]).to.equal(Amount(185));
        });

        it("should result in the Claims contract owning 185 tokens", async function () {
          const { Claims, Token } = await loadFixture(UpdateBalance70True115False);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(185));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("9250000000000000115"); // available (9.25 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                      // available
          expect(res[1]).to.equal("65690677966101694901"); // available (65.69)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("56440677966101694901"); // available (56.44)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                      // allocated
          expect(res[1]).to.equal("53618644067796610083"); // available (53.62)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 7", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(7));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 8", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance70True115False);

          const res = await Claims.searchBalance(Address(8));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });

      describe("12,550,000,000,000 true 46,000,500 false", function () {
        it("should record all votes", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await Claims.searchVotes(Claim(1))).to.deep.equal([0, 2]);
        });

        it("should update balances by rewarding users", async function () {
          const { Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_P())).to.equal(false);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_R())).to.equal(true);
          expect(await Claims.searchResolve(Claim(1), await Claims.CLAIM_BALANCE_U())).to.equal(true);
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
          const { Claims, Token } = await loadFixture(UpdateBalance12TTrue46MFalse);

          expect(await Token.balanceOf(await Claims.getAddress())).to.equal(Amount(12_550_046_000_500));
        });

        it("should calculate balances accurately for signer 0", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("627502300025000022590000000000"); // available (627,502,300,025.00 + captured precision loss)
        });

        it("should calculate balances accurately for signer 1", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("5538459257660247977435000000000"); // available (5,538,459,257,660.25 + proposer fee)
        });

        it("should calculate balances accurately for signer 2", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);                                 // allocated
          expect(res[1]).to.equal("6138542733475723079940000000000"); // available (6,138,542,733,475.72)
        });

        it("should calculate balances accurately for signer 3", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                                // allocated
          expect(res[1]).to.equal("245541709339028920035000000000"); // available (245,541,709,339.03)
        });

        it("should calculate balances accurately for signer 4", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 5", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(5));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 6", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(6));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 7", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(7));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });

        it("should calculate balances accurately for signer 8", async function () {
          const { Address, Claims } = await loadFixture(UpdateBalance12TTrue46MFalse);

          const res = await Claims.searchBalance(Address(8));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        });
      });
    });
  });
});
