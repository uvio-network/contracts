import { Address } from "viem";
import { Amount } from "./src/Amount";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { encodePacked, keccak256 } from "viem";
import { padHex } from "viem";

describe("UVX", function () {
  describe("storageSlot", function () {
    it("should get updated allowance at storage index 3", async function () {
      const { Address, Claims, Signer, UVX } = await loadFixture(Deploy);

      const spd = await Claims.getAddress() as Address;
      const acc = Address(5);
      const ind = BigInt(3);

      {
        await UVX.connect(Signer(5)).approve(spd, Amount(4.45));
      }

      const slt = keccak256(encodePacked(
        [
          "bytes32",
          "bytes32",
        ],
        [
          padHex(spd, { dir: "left", size: 32 }),
          keccak256(encodePacked(
            [
              "bytes32",
              "uint256",
            ],
            [
              padHex(acc, { dir: "left", size: 32 }),
              ind,
            ],
          )),
        ],
      ));

      expect(await ethers.provider.getStorage(await UVX.getAddress(), slt)).to.equal(Amount(4.45));
    });
  });
});
