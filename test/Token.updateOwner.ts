import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Token", function () {
  describe("updateOwner", function () {
    it("should initialize and modify owner address", async function () {
      const { Address, Token, Signer } = await loadFixture(Deploy);

      {
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(true);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await Token.owner();

        expect(own).to.equal(Address(0));
      }

      await Token.connect(Signer(0)).updateOwner(Address(7));

      {
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(true);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await Token.owner();

        expect(own).to.equal(Address(7));
      }

      await Token.connect(Signer(7)).updateOwner(Address(9));

      {
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Token.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true);
      }

      {
        const own = await Token.owner();

        expect(own).to.equal(Address(9));
      }
    });
  });
});
