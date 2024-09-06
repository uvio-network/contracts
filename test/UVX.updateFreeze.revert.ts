import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("UVX", function () {
  describe("updateFreeze", function () {
    describe("revert", function () {
      it("if owner already updated", async function () {
        const { Signer, UVX } = await loadFixture(Deploy);

        {
          expect(await UVX.freeze()).to.equal(false);
        }

        await UVX.connect(Signer(0)).updateFreeze();

        {
          expect(await UVX.freeze()).to.equal(true);
        }

        const txn = UVX.connect(Signer(0)).updateFreeze();

        await expect(txn).to.be.revertedWithCustomError(UVX, "Process");

        {
          expect(await UVX.freeze()).to.equal(true);
        }
      });

      it("if signer 2 tries to change freeze", async function () {
        const { Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(2)).updateFreeze();

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });

      it("if old owner tries to change freeze", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await UVX.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = UVX.connect(Signer(0)).updateFreeze();

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
