import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("UVX", function () {
  describe("updateRestrict", function () {
    describe("revert", function () {
      it("if owner already restrict", async function () {
        const { Signer, UVX } = await loadFixture(Deploy);

        {
          expect(await UVX.restrict()).to.equal(true);
        }

        await UVX.connect(Signer(0)).updateRestrict();

        {
          expect(await UVX.restrict()).to.equal(false);
        }

        const txn = UVX.connect(Signer(0)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(UVX, "Process");

        {
          expect(await UVX.restrict()).to.equal(false);
        }
      });

      it("if signer 2 tries to change restrict", async function () {
        const { Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(2)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if old owner tries to change restrict", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await UVX.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = UVX.connect(Signer(0)).updateRestrict();

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
