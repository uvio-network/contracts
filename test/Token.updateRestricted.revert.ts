import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Token", function () {
  describe("updateRestricted", function () {
    describe("revert", function () {
      it("if owner already restricted", async function () {
        const { Token, Signer } = await loadFixture(Deploy);

        {
          expect(await Token.restricted()).to.equal(true);
        }

        await Token.connect(Signer(0)).updateRestricted();

        {
          expect(await Token.restricted()).to.equal(false);
        }

        const txn = Token.connect(Signer(0)).updateRestricted();

        await expect(txn).to.be.revertedWithCustomError(Token, "Process");

        {
          expect(await Token.restricted()).to.equal(false);
        }
      });

      it("if signer 2 tries to change restricted", async function () {
        const { Token, Signer } = await loadFixture(Deploy);

        const txn = Token.connect(Signer(2)).updateRestricted();

        await expect(txn).to.be.revertedWithCustomError(Token, "AccessControlUnauthorizedAccount");
      });

      it("if old owner tries to change restricted", async function () {
        const { Address, Token, Signer } = await loadFixture(Deploy);

        await Token.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await Token.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = Token.connect(Signer(0)).updateRestricted();

        await expect(txn).to.be.revertedWithCustomError(Token, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
