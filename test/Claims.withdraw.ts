import { Amount } from "./src/Amount";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { UpdateBalance25False } from "./src/Deploy";
import { UpdateBalance25True } from "./src/Deploy";
import { UpdateBalance20True30False } from "./src/Deploy";
import { UpdateBalance30True20False } from "./src/Deploy";

describe("Claims", function () {
  describe("withdraw", function () {
    describe("25 true", function () {
      it("should not have any effect if balance is empty", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25True);

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(25.00)); // available
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);

          await Claims.connect(Signer(1)).withdraw(0);

          expect(await UVX.balanceOf(Address(1))).to.equal(0);
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(25.00)); // available
        }
      });

      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25True);

        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
      });

      it("should allow signer 1 to withdraw 25 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25True);

        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(5));
        await Claims.connect(Signer(1)).withdraw(Amount(10));
        await Claims.connect(Signer(1)).withdraw(Amount(10));

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
      });
    });

    describe("25 false", function () {
      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance25False);

        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
      });
    });

    describe("20 true 30 false", function () {
      it("should not have any effect if balance is empty", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

        {
          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(23.50)); // available
        }

        {
          expect(await UVX.balanceOf(Address(2))).to.equal(0);

          await Claims.connect(Signer(2)).withdraw(0); // withdrawing nothing

          expect(await UVX.balanceOf(Address(2))).to.equal(0);
        }

        {
          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(23.50)); // available
        }
      });

      it("should allow signer 0 to withdraw 1.50 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(1.50)); // available
        }

        {
          expect(await UVX.balanceOf(Address(0))).to.equal(0);

          await Claims.connect(Signer(0)).withdraw(Amount(1.50)); // withdraw all at once

          expect(await UVX.balanceOf(Address(0))).to.equal(Amount(1.50));
        }

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });

      it("should allow signer 0 to withdraw 2.50 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);            // allocated
          expect(res[1]).to.equal(Amount(1.50)); // available
        }

        {
          expect(await UVX.balanceOf(Address(0))).to.equal(0);

          await Claims.connect(Signer(0)).withdraw(Amount(0.50));
          await Claims.connect(Signer(0)).withdraw(Amount(0.10));
          await Claims.connect(Signer(0)).withdraw(Amount(0.90));

          expect(await UVX.balanceOf(Address(0))).to.equal(Amount(1.50));
        }

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });

      it("should allow signer 1 to withdraw 25 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

        expect(await UVX.balanceOf(Address(1))).to.equal(0);

        await Claims.connect(Signer(1)).withdraw(Amount(25));

        expect(await UVX.balanceOf(Address(1))).to.equal(Amount(25));

        const res = await Claims.searchBalance(Address(1));

        expect(res[0]).to.equal(0); // allocated
        expect(res[1]).to.equal(0); // available

        const txn = Claims.connect(Signer(1)).withdraw(1);

        await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
      });

      it("should allow signer 2 to withdraw 23.50 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance20True30False);

        {
          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0);             // allocated
          expect(res[1]).to.equal(Amount(23.50)); // available
        }

        {
          expect(await UVX.balanceOf(Address(2))).to.equal(0);

          await Claims.connect(Signer(2)).withdraw(Amount(23.50));

          expect(await UVX.balanceOf(Address(2))).to.equal(Amount(23.50));
        }

        {
          const res = await Claims.searchBalance(Address(2));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(2)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });
    });

    describe("30 true 20 false", function () {
      it("should allow signer 0 to withdraw 1.00 tokens plus captured precision loss once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("1000000000000000018"); // available
        }

        {
          expect(await UVX.balanceOf(Address(0))).to.equal(0);

          await Claims.connect(Signer(0)).withdraw("1000000000000000018");

          expect(await UVX.balanceOf(Address(0))).to.equal("1000000000000000018");
        }

        {
          const res = await Claims.searchBalance(Address(0));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(0)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });

      it("should allow signer 1 to withdraw 1.00 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("1000000000000000000"); // available
        }

        {
          expect(await UVX.balanceOf(Address(1))).to.equal(0);

          await Claims.connect(Signer(1)).withdraw("1000000000000000000");

          expect(await UVX.balanceOf(Address(1))).to.equal("1000000000000000000");
        }

        {
          const res = await Claims.searchBalance(Address(1));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(1)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });

      it("should allow signer 3 to withdraw about 16.00 tokens once", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available
        }

        {
          expect(await UVX.balanceOf(Address(3))).to.equal(0);

          await Claims.connect(Signer(3)).withdraw("15999999999999999994");

          expect(await UVX.balanceOf(Address(3))).to.equal("15999999999999999994");
        }

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }

        {
          const txn = Claims.connect(Signer(3)).withdraw(1);

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }
      });

      it("should allow signer 3 to withdraw about 16.00 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available
        }

        {
          expect(await UVX.balanceOf(Address(3))).to.equal(0);

          await Claims.connect(Signer(3)).withdraw("5000000000000000000");          //  5.00
          await Claims.connect(Signer(3)).withdraw("5000000000000000000");          //  5.00

          expect(await UVX.balanceOf(Address(3))).to.equal("10000000000000000000"); // 10.00
        }

        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("5999999999999999994"); // available
        }

        {
          const txn = Claims.connect(Signer(3)).withdraw("6000000000000000000"); // 6.00

          await expect(txn).to.be.revertedWithPanic(0x11); // Arithmetic operation overflowed outside of an unchecked block
        }

        // After the failed withdrawal the balance is as it was before.
        {
          const res = await Claims.searchBalance(Address(3));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("5999999999999999994"); // available
        }
      });

      it("should allow signer 4 to withdraw about 16.00 tokens with multiple calls", async function () {
        const { Address, Claims, Signer, UVX } = await loadFixture(UpdateBalance30True20False);

        {
          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("15999999999999999994"); // available
        }

        {
          expect(await UVX.balanceOf(Address(4))).to.equal(0);

          await Claims.connect(Signer(4)).withdraw("2500000000000000000");          //  2.50
          await Claims.connect(Signer(4)).withdraw("5000000000000000000");          //  5.00
          await Claims.connect(Signer(4)).withdraw("2500000000000000000");          //  2.50

          expect(await UVX.balanceOf(Address(4))).to.equal("10000000000000000000"); // 10.00
        }

        {
          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0);                     // allocated
          expect(res[1]).to.equal("5999999999999999994"); // available
        }

        {
          expect(await UVX.balanceOf(Address(4))).to.equal("10000000000000000000"); // 10.00

          await Claims.connect(Signer(4)).withdraw("5999999999999999994");

          expect(await UVX.balanceOf(Address(4))).to.equal("15999999999999999994"); // 16.00
        }

        {
          const res = await Claims.searchBalance(Address(4));

          expect(res[0]).to.equal(0); // allocated
          expect(res[1]).to.equal(0); // available
        }
      });
    });
  });
});
