import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { zeroAddress } from "viem";

describe("Claims", function () {
  describe("updateOwner", function () {
    describe("revert", function () {
      it("if owner is empty", async function () {
        const { Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateOwner(zeroAddress);

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if owner is current owner", async function () {
        const { Address, Claims, Signer } = await loadFixture(Deploy);

        const txn = Claims.connect(Signer(0)).updateOwner(Address(0));

        await expect(txn).to.be.revertedWithCustomError(Claims, "Process");
      });

      it("if old owner tries to update owner", async function () {
        const { Address, Claims, Signer } = await loadFixture(Deploy);

        await Claims.connect(Signer(0)).updateOwner(Address(7));

        {
          const own = await Claims.owner();

          expect(own).to.equal(Address(7));
        }

        const txn = Claims.connect(Signer(0)).updateOwner(Address(9));

        await expect(txn).to.be.revertedWithCustomError(Claims, "AccessControlUnauthorizedAccount");
      });
    });
  });
});
