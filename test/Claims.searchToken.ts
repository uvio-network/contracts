import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { ethers } from "hardhat";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("searchToken", function () {
    it("should search for whitelisted tokens, single", async function () {
      const { Balance, Claims, Signer } = await loadFixture(Deploy);

      const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);

      const a18 = await Stablecoin18.getAddress();

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
        [a18],
      );

      expect(await Claims.searchToken(Claim(1))).to.deep.equal([
        await Stablecoin18.getAddress(),
      ]);
    });

    it("should search for whitelisted tokens, multi", async function () {
      const { Balance, Claims, Signer } = await loadFixture(Deploy);

      const Stablecoin6 = await ethers.deployContract("Stablecoin", [6]);
      const Stablecoin18 = await ethers.deployContract("Stablecoin", [18]);
      const Stablecoin30 = await ethers.deployContract("Stablecoin", [30]);

      const ad6 = await Stablecoin6.getAddress();
      const a18 = await Stablecoin18.getAddress();
      const a30 = await Stablecoin30.getAddress();

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
        [ad6, a18, a30],
      );

      expect(await Claims.searchToken(Claim(1))).to.deep.equal([
        await Stablecoin6.getAddress(),
        await Stablecoin18.getAddress(),
        await Stablecoin30.getAddress(),
      ]);
    });

    it("should not find whitelisted tokens for propose without whitelisted tokens", async function () {
      const { Balance, Claims, Signer } = await loadFixture(Deploy);

      await Balance([1], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
        [],
      );

      expect(await Claims.searchToken(Claim(1))).to.deep.equal([]);
    });

    it("should not find whitelisted tokens for propose that does not exist", async function () {
      const { Claims } = await loadFixture(Deploy);

      expect(await Claims.searchToken(Claim(7364576))).to.deep.equal([]);
    });
  });
});
