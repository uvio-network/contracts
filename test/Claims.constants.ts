import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("constants", function () {
    it("should expose BASIS_TOTAL as the total amount of basis points", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.BASIS_TOTAL()).to.equal(10_000);
    });

    it("should expose BOT_ROLE encoded hash", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.BOT_ROLE()).to.equal(Role("BOT_ROLE"));
    });

    it("should expose MAX_UINT256 as the upper numerical limit", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.MAX_UINT256()).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    });

    it("should expose MID_UINT256 as the reserved left and right handside index for the claim proposer", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.MID_UINT256()).to.equal("57896044618658097711785492504343953926634992332820282019728792003956564819967");
    });

    it("should expose VERSION constant", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.VERSION()).to.equal("v0.0.0");
    });
  });
});
