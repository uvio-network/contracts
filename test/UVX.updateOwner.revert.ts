import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { zeroAddress } from "viem";

describe("UVX", function () {
  describe("updateOwner", function () {
    describe("revert", function () {
      it("if owner is empty", async function () {
        const { Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(0)).updateOwner(zeroAddress);

        await expect(txn).to.be.revertedWithCustomError(UVX, "Process");
      });

      it("if owner is current owner", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        const txn = UVX.connect(Signer(0)).updateOwner(Address(0));

        await expect(txn).to.be.revertedWithCustomError(UVX, "Process");
      });

      it("if old owner tries to update owner", async function () {
        const { Address, Signer, UVX } = await loadFixture(Deploy);

        await UVX.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await UVX.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = UVX.connect(Signer(0)).updateOwner(Address(9));

        await expect(txn).to.be.revertedWithCustomError(UVX, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
