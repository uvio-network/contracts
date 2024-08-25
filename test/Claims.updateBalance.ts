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
        [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
        Expiry(7, "days"),
      );

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      await Claims.connect(Signer(5)).updateResolve(
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

    it("should update balances by rewarding users", async function () {
      const { Claims } = await loadFixture(updateBalance);

      expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_P())).to.equal(false);
      expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_R())).to.equal(true);
      expect(await Claims.searchResolve(Claim(7), await Claims.CLAIM_BALANCE_U())).to.equal(true);
    });

    it("should calculate the total available balances accurately", async function () {
      const { Address, Claims } = await loadFixture(updateBalance);

      const zer = await Claims.searchBalance(Address(0));
      const one = await Claims.searchBalance(Address(1));
      const two = await Claims.searchBalance(Address(2));

      expect(zer[1] + one[1] + two[1]).to.equal(Amount(50));
    });

    it("should calculate balances accurately for signer 0", async function () {
      const { Address, Claims } = await loadFixture(updateBalance);

      const res = await Claims.searchBalance(Address(0)); // protocol owner receiving rewards

      expect(res[0]).to.equal(0);           // allocated
      expect(res[1]).to.equal(Amount(2.5)); // available
    });

    it("should calculate balances accurately for signer 1", async function () {
      const { Address, Claims } = await loadFixture(updateBalance);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(0);          // allocated
      expect(res[1]).to.equal(Amount(25)); // available
    });

    it("should calculate balances accurately for signer 2", async function () {
      const { Address, Claims } = await loadFixture(updateBalance);

      const res = await Claims.searchBalance(Address(2));

      expect(res[0]).to.equal(0);            // allocated
      expect(res[1]).to.equal(Amount(22.5)); // available
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
});
