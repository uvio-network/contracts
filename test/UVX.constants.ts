import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("constants", function () {
    it("should expose BOT_ROLE encoded hash", async function () {
      const { UVX } = await loadFixture(Deploy);

      expect(await UVX.BOT_ROLE()).to.equal(Role("BOT_ROLE"));
    });

    it("should expose CONTRACT_ROLE encoded hash", async function () {
      const { UVX } = await loadFixture(Deploy);

      expect(await UVX.CONTRACT_ROLE()).to.equal(Role("CONTRACT_ROLE"));
    });

    it("should expose LOAN_ROLE encoded hash", async function () {
      const { UVX } = await loadFixture(Deploy);

      expect(await UVX.LOAN_ROLE()).to.equal(Role("LOAN_ROLE"));
    });

    it("should expose TOKEN_ROLE encoded hash", async function () {
      const { UVX } = await loadFixture(Deploy);

      expect(await UVX.TOKEN_ROLE()).to.equal(Role("TOKEN_ROLE"));
    });

    it("should expose VERSION constant", async function () {
      const { UVX } = await loadFixture(Deploy);

      expect(await UVX.VERSION()).to.equal("v0.3.0");
    });
  });
});
