import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { Index } from "./src/Index";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";

describe("Claims", function () {
  describe("updateResolve", function () {
    const createResolve = async () => {
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

      await Claims.connect(Signer(7)).createResolve(
        Claim(1),
        Claim(7),
        [Index(0), Index(4)], // index 0 and 4 are address 1 and 5
        Expiry(7, "days"),
      );

      return { Address, Claims, Signer, Token };
    }

    it("no votes are recorded by default", async function () {
      const { Claims } = await loadFixture(createResolve);

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(0); // yay
      expect(res[1]).to.equal(0); // nah
    });

    it("signer 1 can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(1); // yay
      expect(res[1]).to.equal(0); // nah
    });

    it("signer 1 can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(false),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(0); // yay
      expect(res[1]).to.equal(1); // nah
    });

    it("signer 5 can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(5)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(1); // yay
      expect(res[1]).to.equal(0); // nah
    });

    it("signer 5 can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(5)).updateResolve(
        Claim(1),
        Claim(7),
        Side(false),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(0); // yay
      expect(res[1]).to.equal(1); // nah
    });

    it("all signers can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      await Claims.connect(Signer(5)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(2); // yay
      expect(res[1]).to.equal(0); // nah
    });

    it("all signers can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(false),
      );

      await Claims.connect(Signer(5)).updateResolve(
        Claim(1),
        Claim(7),
        Side(false),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(0); // yay
      expect(res[1]).to.equal(2); // nah
    });

    it("signer 1 can verify the truth with true 6 days in", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]); // expiry is 7 days
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Claim(7),
        Side(true),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(1); // yay
      expect(res[1]).to.equal(0); // nah
    });

    it("signer 5 can verify the false with false 6 days in", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]); // expiry is 7 days
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(5)).updateResolve(
        Claim(1),
        Claim(7),
        Side(false),
      );

      const res = await Claims.searchVotes(Claim(7));

      expect(res[0]).to.equal(0); // yay
      expect(res[1]).to.equal(1); // nah
    });
  });
});
