import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { Deploy } from "./src/Deploy";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./src/Role";
import { Side } from "./src/Side";

const EXPIRY = Expiry(2, "days");
const MAX = maxUint256;

describe("Claims", function () {
  describe("updateResolve", function () {
    const createResolve = async () => {
      const { Address, Balance, Claims, Signer, UVX } = await loadFixture(Deploy);

      await Balance([1, 2, 3, 4, 5], 10);

      await Claims.connect(Signer(1)).createPropose(
        Claim(1),
        Amount(10),
        Side(true),
        EXPIRY,
        "",
        [],
      );
      await Claims.connect(Signer(2)).updatePropose(
        Claim(1),
        Amount(10),
        Side(true),
        0,
      );

      await Claims.connect(Signer(3)).updatePropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );
      await Claims.connect(Signer(4)).updatePropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );
      await Claims.connect(Signer(5)).updatePropose(
        Claim(1),
        Amount(10),
        Side(false),
        0,
      );

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

      await Claims.connect(Signer(7)).createResolve(
        Claim(1),
        [0, MAX], // address 1 and 3
        Expiry(7, "days"),
      );

      return { Address, Claims, Signer, UVX };
    }

    it("no votes are recorded by default", async function () {
      const { Claims } = await loadFixture(createResolve);

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([2]); // address 1 did not vote
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([2]); // address 3 did not vote
    });

    it("signer 1 can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Side(true),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([1]); // address 1 voted true
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([2]); // address 3 did not vote
    });

    it("signer 1 can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Side(false),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([0]); // address 1 voted false
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([2]); // address 3 did not vote
    });

    it("signer 3 can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(3)).updateResolve(
        Claim(1),
        Side(true),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([2]); // address 1 did not vote
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([1]); // address 3 voted true
    });

    it("signer 3 can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(3)).updateResolve(
        Claim(1),
        Side(false),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([2]); // address 1 did not vote
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([0]); // address 3 voted false
    });

    it("all signers can verify the truth with true", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Side(true),
      );

      await Claims.connect(Signer(3)).updateResolve(
        Claim(1),
        Side(true),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([1]); // address 1 voted true
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([1]); // address 1 voted true
    });

    it("all signers can verify the truth with false", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Side(false),
      );

      await Claims.connect(Signer(3)).updateResolve(
        Claim(1),
        Side(false),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([0]); // address 1 voted false
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([0]); // address 1 voted false
    });

    it("signer 1 can verify the truth with true 6 days in", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]); // expiry is 7 days
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(1)).updateResolve(
        Claim(1),
        Side(true),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([1]); // address 1 voted true
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([2]); // address 3 did not vote
    });

    it("signer 3 can verify the truth with false 6 days in", async function () {
      const { Claims, Signer } = await loadFixture(createResolve);

      await network.provider.send("evm_setNextBlockTimestamp", [Expiry(6, "days")]); // expiry is 7 days
      await network.provider.send("evm_mine");

      await Claims.connect(Signer(3)).updateResolve(
        Claim(1),
        Side(false),
      );

      const ind = await Claims.searchIndices(Claim(1));

      expect(await Claims.searchSamples(Claim(1), ind[1], ind[2])).to.deep.equal([2]); // address 1 did not vote
      expect(await Claims.searchSamples(Claim(1), ind[5], ind[6])).to.deep.equal([0]); // address 3 voted false
    });
  });
});
