import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("createPropose", function () {
    const createPropose = async () => {
      const { Address, Claims, Signer, Token } = await loadFixture(Deploy);

      await Token.mint(Address(1), Amount(10));
      await Token.connect(Signer(1)).approve(await Claims.getAddress(), Amount(10));

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        Expiry(2, "days"),
      );

      return { Address, Claims, Signer, Token };
    }

    it("should propose claim for users with funds", async function () {
      const { Claims } = await loadFixture(createPropose);

      expect(await Claims.searchMaximum(Claim(1))).to.equal(1);
    });

    it("should allocate a user balance", async function () {
      const { Address, Claims } = await loadFixture(createPropose);

      const res = await Claims.searchBalance(Address(1));

      expect(res[0]).to.equal(Amount(10)); // allocated
      expect(res[1]).to.equal(0);          // available
    });
  });
});
