import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

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
        0,
      );

      await Claims.connect(Signer(3)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );
      await Claims.connect(Signer(4)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );
      await Claims.connect(Signer(5)).createPropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
      await network.provider.send("evm_mine");

      return { Address, Claims, Signer, Token };
    }

    it("signer 7 can create claim with lifecycle phase resolve", async function () {
      const { Address, Claims, Signer } = await loadFixture(createPropose);

      await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

      await Claims.connect(Signer(7)).createResolve(
        Claim(1),
        Claim(7),
        [Index(+1), Index(-1)], // index +1 and -1 are address 1 and 3
        Expiry(7, "days"),
      );

      expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([Address(1), Address(3)]);
    });

    it("signer 9 can create claim with lifecycle phase resolve", async function () {
      const { Address, Claims, Signer } = await loadFixture(createPropose);

      await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(9));

      await Claims.connect(Signer(9)).createResolve(
        Claim(1),
        Claim(7),
        [Index(+2), Index(-2)], // index +2 and -2 are address 2 and 4
        Expiry(7, "days"),
      );

      expect(await Claims.searchSamples(Claim(1), 0, 100)).to.deep.equal([Address(2), Address(4)]);
    });
  });
});
