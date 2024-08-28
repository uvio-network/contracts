import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("constants", function () {
    it("should expose BOT_ROLE encoded hash", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.BOT_ROLE()).to.equal(Role("BOT_ROLE"));
    });

    it("should expose MAX_UINT256 encoded hash", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.MAX_UINT256()).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935");
    });

    it("should expose MID_UINT256 encoded hash", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.MID_UINT256()).to.equal("57896044618658097711785492504343953926634992332820282019728792003956564819967");
    });
  });
});
