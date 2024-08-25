import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Role } from "./src/Role";

describe("Claims", function () {
  describe("createResolve", function () {
    describe("grantRole", function () {
      const createPropose = async () => {
        const { Address, Claims, Signer } = await loadFixture(Deploy);

        return { Address, Claims, Signer };
      }

      it("should grant roles using the right role", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

        {
          expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(false);
          expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
        }

        {
          await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));
        }

        {
          expect(await Claims.hasRole(Role("BOT_ROLE"), Address(7))).to.equal(true);
          expect(await Claims.hasRole(Role("BOT_ROLE"), Address(9))).to.equal(false);
        }
      });

      it("should not grant roles using the wrong role", async function () {
        const { Address, Claims, Signer } = await loadFixture(createPropose);

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
      });
    });
  });
});
