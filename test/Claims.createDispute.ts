import moment from "moment";

import { Amount } from "./src/Amount";
import { Claim } from "./src/Claim";
import { expect } from "chai";
import { Expiry } from "./src/Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./src/Side";
import { UpdateResolve20True30False } from "./src/Deploy";

describe("Claims", function () {
  describe("createDispute", function () {
    describe("once", function () {
      it("with minimum balance", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(15, "days"), // 7 days from the 8 days above
          "",
          Claim(1),
        );

        const res = await Claims.searchBalance(Address(4));

        expect(res[0]).to.equal(Amount(30)); // allocated (20 + 10 from before)
        expect(res[1]).to.equal(0);          // available
      });

      it("with minimum expiry", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(265, "hours"), // 3 days + 1 hour from the 8 days above
          "",
          Claim(1),
        );

        const res = await Claims.searchBalance(Address(4));

        expect(res[0]).to.equal(Amount(30)); // allocated (20 + 10 from before)
        expect(res[1]).to.equal(0);          // available
      });

      it("with maximum expiry", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(8, "days")]); // after resolve expired
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          moment().add(8, "days").unix() + 2592000, // 30 days from the 8 days above
          "",
          Claim(1),
        );

        const res = await Claims.searchBalance(Address(4));

        expect(res[0]).to.equal(Amount(30)); // allocated (20 + 10 from before)
        expect(res[1]).to.equal(0);          // available
      });

      it("up until resolve expiry", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(335, "hours")]); // 14 days after resolve expiry -1 hour
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        const res = await Claims.searchBalance(Address(4));

        expect(res[0]).to.equal(Amount(30)); // allocated (20 + 10 from before)
        expect(res[1]).to.equal(0);          // available
      });

      it("should create dispute without content reference", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(335, "hours")]); // 14 days after resolve expiry -1 hour
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        expect(await Claims.searchContent(Claim(13))).to.deep.equal("");
      });

      it("should create dispute with content reference", async function () {
        const { Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(335, "hours")]); // 14 days after resolve expiry -1 hour
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "0x5678",
          Claim(1),
        );

        expect(await Claims.searchContent(Claim(13))).to.deep.equal("0x5678");
      });

      it("should emit event", async function () {
        const { Address, Balance, Claims, Signer } = await loadFixture(UpdateResolve20True30False);

        await network.provider.send("evm_setNextBlockTimestamp", [Expiry(335, "hours")]); // 14 days after resolve expiry -1 hour
        await network.provider.send("evm_mine");

        await Balance([4], 20);

        const txn = await Claims.connect(Signer(4)).createDispute(
          Claim(13),
          Amount(20),
          Side(true),
          Expiry(21, "days"), // 7 days from the 14 days above
          "",
          Claim(1),
        );

        await expect(txn).to.emit(Claims, "DisputeCreated").withArgs(Claim(13), Address(4), Amount(20), Expiry(21, "days"));
      });
    });
  });
});
