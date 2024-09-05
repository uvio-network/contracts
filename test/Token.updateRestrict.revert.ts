import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Token", function () {
  describe("updateRestrict", function () {
    describe("revert", function () {
      it("if owner already restrict", async function () {
        const { Token, Signer } = await loadFixture(Deploy);

        {
          expect(await Token.restrict()).to.equal(true);
        }

        await Token.connect(Signer(0)).updateRestrict();

        {
          expect(await Token.restrict()).to.equal(false);
        }

        const txn = Token.connect(Signer(0)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(Token, "Process");

        {
          expect(await Token.restrict()).to.equal(false);
        }
      });

      it("if signer 2 tries to change restrict", async function () {
        const { Token, Signer } = await loadFixture(Deploy);

        const txn = Token.connect(Signer(2)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(Token, "AccessControlUnauthorizedAccount");
      });

      it("if old owner tries to change restrict", async function () {
        const { Address, Token, Signer } = await loadFixture(Deploy);

        await Token.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await Token.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = Token.connect(Signer(0)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(Token, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
