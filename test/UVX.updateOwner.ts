import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("UVX", function () {
  describe("updateOwner", function () {
    it("should initialize and modify owner address", async function () {
      const { Address, UVX, Signer } = await loadFixture(Deploy);

      {
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(true);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await UVX.owner();

        expect(own).to.equal(Address(0));
      }

      await UVX.connect(Signer(0)).updateOwner(Address(7));

      {
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(true);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        const own = await UVX.owner();

        expect(own).to.equal(Address(7));
      }

      await UVX.connect(Signer(7)).updateOwner(Address(9));

      {
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(0))).to.equal(false);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await UVX.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true);
      }

      {
        const own = await UVX.owner();

        expect(own).to.equal(Address(9));
      }
    });
  });
});
