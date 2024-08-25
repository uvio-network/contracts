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
  });
});
