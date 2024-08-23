import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { Index } from "./src/Index";

describe("Claims", function () {
  describe("createResolve", function () {
    const createPropose = async () => {
      const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

      await Balance([1, 2, 3, 4, 5], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(2)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(3)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(4)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        Expiry(2, "days"),
      );
      await Claims.connect(Signer(5)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        Expiry(2, "days"),
      );

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
      await network.provider.send("evm_mine");

      return { Address, Claims, Signer, Token };
    }

    it("should create claim with lifecycle phase resolve", async function () {
      const { Address, Claims, Signer } = await loadFixture(createPropose);

      await Claims.connect(Signer(0)).createResolve(
        Claim(1),
        Claim(7),
        [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
        Expiry(7, "days"),
      );

      expect(await Claims.searchStaker(Claim(1))).to.deep.equal([Address(1), Address(2), Address(3), Address(4), Address(5)]);
      expect(await Claims.searchSample(Claim(1), Claim(7))).to.deep.equal([Address(1), Address(5)]);
    });
  });
});
