import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { zeroAddress } from "viem";

describe("Token", function () {
  describe("updateOwner", function () {
    describe("revert", function () {
      it("if owner is empty", async function () {
        const { Token, Signer } = await loadFixture(Deploy);

        const txn = Token.connect(Signer(0)).updateOwner(zeroAddress);

        await expect(txn).to.be.revertedWithCustomError(Token, "Process");
      });

      it("if owner is current owner", async function () {
        const { Address, Token, Signer } = await loadFixture(Deploy);

        const txn = Token.connect(Signer(0)).updateOwner(Address(0));

        await expect(txn).to.be.revertedWithCustomError(Token, "Process");
      });

      it("if old owner tries to update owner", async function () {
        const { Address, Token, Signer } = await loadFixture(Deploy);

        await Token.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await Token.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = Token.connect(Signer(0)).updateOwner(Address(9));

        await expect(txn).to.be.revertedWithCustomError(Token, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
