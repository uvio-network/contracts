import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

const EXPIRY_D = Expiry(2, "days");
const EXPIRY_W = Expiry(9, "weeks");
const EXPIRY_M = Expiry(3, "months");

describe("Claims", function () {
  describe("searchExpired", function () {
    it("should not return any expiry if no claim got proposed", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.searchExpired(Claim(1))).to.equal(0);
    });

    it("should return the correct expiry for propose 1, 2 days", async function () {
      const { Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        EXPIRY_D,
      );

      expect(await Claims.searchExpired(Claim(1))).to.equal(EXPIRY_D);
    });

    it("should return the correct expiry for propose 4, 9 weeks", async function () {
      const { Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(4),
        Amount(10),
        Side(true),
        EXPIRY_W,
      );

      expect(await Claims.searchExpired(Claim(4))).to.equal(EXPIRY_W);
    });

    it("should return the correct expiry for resolve 7, 3 months", async function () {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        EXPIRY_D,
      );

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

      await Claims.connect(Signer(9)).createResolve(
        Claim(1),
        Claim(7),
        [0], // address 1
        EXPIRY_M,
      );

      expect(await Claims.searchExpired(Claim(1))).to.equal(EXPIRY_D);
      expect(await Claims.searchExpired(Claim(7))).to.equal(EXPIRY_M);
    });

    it("should return the correct expiry for resolve 7, 2 days", async function () {
      const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        EXPIRY_W,
      );

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(64, "days")]);
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

      await Claims.connect(Signer(9)).createResolve(
        Claim(1),
        Claim(7),
        [0], // address 1
        EXPIRY_D,
      );

      expect(await Claims.searchExpired(Claim(1))).to.equal(EXPIRY_W);
      expect(await Claims.searchExpired(Claim(7))).to.equal(EXPIRY_D);
    });
  });
});
