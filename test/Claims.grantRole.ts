import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("grantRole", function () {
    it("should grant roles using BOT_ROLE", async function () {
      const { Address, Claims, Signer } = await loadFixture(Deploy);

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(true); // granted
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(true);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(true); // granted
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("BOT_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false); // revoked
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(true);
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("BOT_ROLE"), Address(5)); // invalid
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(true);
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("BOT_ROLE"), Address(9));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false); // revoked
      }
    });

    it("should grant roles using DEFAULT_ADMIN_ROLE", async function () {
      const { Address, Claims, Signer } = await loadFixture(Deploy);

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).grantRole(Role("DEFAULT_ADMIN_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(true); // granted
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).grantRole(Role("DEFAULT_ADMIN_ROLE"), Address(9));
      }

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(true);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true); // granted
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("DEFAULT_ADMIN_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false); // revoked
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true);
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("DEFAULT_ADMIN_ROLE"), Address(5)); // invalid
      }

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(true);
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("DEFAULT_ADMIN_ROLE"), Address(9));
      }

      {
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("DEFAULT_ADMIN_ROLE"), Address(9))).to.equal(false); // revoked
      }
    });

    it("should not grant roles using the wrong role", async function () {
      const { Address, Claims, Signer } = await loadFixture(Deploy);

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).grantRole(Role("NOT_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
      }

      {
        await Claims.connect(Signer(0)).revokeRole(Role("NOT_ROLE"), Address(7));
      }

      {
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
        expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
      }
    });
  });
});
