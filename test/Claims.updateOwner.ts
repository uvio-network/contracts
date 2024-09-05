import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("updateOwner", function () {
    it("should initialize and modify owner address", async function () {
      const { Address, Claims, Signer } = await loadFixture(Deploy);

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(true);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await Claims.owner();

        expect(own).to.equal(Address(0));
      }

      await Claims.connect(Signer(0)).updateOwner(Address(7));

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(true);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await Claims.owner();

        expect(own).to.equal(Address(7));
      }

      await Claims.connect(Signer(7)).updateOwner(Address(9));

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true);
      }

      {
        const own = await Claims.owner();

        expect(own).to.equal(Address(9));
      }
    });
  });
});
