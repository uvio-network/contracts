import { Address } from "viem";
import { Amount } from "./Amount";
import { Claim } from "./Claim";
import { ethers } from "hardhat";
import { Expiry } from "./Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { maxUint256 } from "viem";
import { network } from "hardhat";
import { Role } from "./Role";
import { Side } from "./Side";

const MAX = maxUint256;

export const Deploy = async () => {
  const sig = await ethers.getSigners();

  const tok = await ethers.deployContract("Token");
  const cla = await ethers.deployContract("Claims", [await tok.getAddress(), sig[0].address]);

  return {
    Address: (ind: number): Address => {
      return sig[ind].address as Address;
    },
    Balance: async (ind: number[], amn: number | number[]) => {
      const add = await cla.getAddress();

      await Promise.all(ind.map(async (x, i) => {
        const val = Amount(Array.isArray(amn) ? amn[i] : amn);

        await tok.mint(sig[x].address, val);
        await tok.connect(sig[x]).approve(add, val);
      }));
    },
    Claims: cla,
    Signer: (ind: number) => {
      return sig[ind];
    },
    Token: tok,
  };
};

export const CreatePropose16 = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 50);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(3)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(4)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(5)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(6)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(7)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );
  await Claims.connect(Signer(8)).createPropose(
    Claim(1),
    Amount(50),
    Side(true),
    0,
  );

  await Claims.connect(Signer(9)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(10)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(11)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(12)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(13)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(14)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(15)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );
  await Claims.connect(Signer(16)).createPropose(
    Claim(1),
    Amount(50),
    Side(false),
    0,
  );

  return { Address, Balance, Claims, Signer };
};

export const CreatePropose16Expired = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(CreatePropose16);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer };
};

export const UpdateBalance25True = async () => {
  const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

  await Balance([1], 25);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(25),
    Side(true),
    Expiry(2, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    Claim(7),
    [0], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, Token };
};

export const UpdateBalance25False = async () => {
  const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

  await Balance([1], 25);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(25),
    Side(false),
    Expiry(2, "days"),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    Claim(7),
    [MAX], // address 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, Token };
};

export const UpdateBalance20True30False = async () => {
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

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    Claim(7),
    [0, MAX], // address 1 and 3
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(3)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, Token };
};

export const UpdateBalance30True20False = async () => {
  const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5], 10);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(false),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).createPropose(
    Claim(1),
    Amount(10),
    Side(false),
    0,
  );

  await Claims.connect(Signer(3)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    0,
  );
  await Claims.connect(Signer(4)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    0,
  );
  await Claims.connect(Signer(5)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    0,
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    Claim(7),
    [0, MAX], // address 1 and 3
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(3)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    3,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    2,
  );

  return { Address, Claims, Signer, Token };
};

export const UpdateBalance70True115False = async () => {
  const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8], 50);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).createPropose(
    Claim(1),
    Amount(20),
    Side(true),
    0,
  );
  await Claims.connect(Signer(3)).createPropose(
    Claim(1),
    Amount(30),
    Side(true),
    0,
  );
  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(10),
    Side(true),
    Expiry(2, "days"),
  );

  await Claims.connect(Signer(4)).createPropose(
    Claim(1),
    Amount(25),
    Side(false),
    0,
  );
  await Claims.connect(Signer(5)).createPropose(
    Claim(1),
    Amount(30),
    Side(false),
    0,
  );
  await Claims.connect(Signer(6)).createPropose(
    Claim(1),
    Amount(30),
    Side(false),
    0,
  );
  await Claims.connect(Signer(7)).createPropose(
    Claim(1),
    Amount(20),
    Side(false),
    0,
  );
  await Claims.connect(Signer(8)).createPropose(
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
    Claim(7),
    [0, MAX], // address 1 and 4
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(true),
  );

  await Claims.connect(Signer(4)).updateResolve(
    Claim(1),
    Side(true),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    5,
  );

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    5,
  );

  return { Address, Claims, Signer, Token };
};

export const UpdateBalance12TTrue46MFalse = async () => {
  const { Address, Balance, Claims, Signer, Token } = await loadFixture(Deploy);

  await Balance([1, 2, 3, 4, 5, 6, 7, 8], 10_000_000_000_000);

  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(300),
    Side(false),
    Expiry(2, "days"),
  );
  await Claims.connect(Signer(2)).createPropose(
    Claim(1),
    Amount(25_000_000),
    Side(false),
    0,
  );
  await Claims.connect(Signer(3)).createPropose(
    Claim(1),
    Amount(1_000_000),
    Side(false),
    0,
  );
  await Claims.connect(Signer(1)).createPropose(
    Claim(1),
    Amount(20_000_200),
    Side(false),
    Expiry(2, "days"),
  );

  await Claims.connect(Signer(4)).createPropose(
    Claim(1),
    Amount(10_000_000_000_000),
    Side(true),
    0,
  );
  await Claims.connect(Signer(5)).createPropose(
    Claim(1),
    Amount(2_000_000_000_000),
    Side(true),
    0,
  );
  await Claims.connect(Signer(6)).createPropose(
    Claim(1),
    Amount(500_000_000_000),
    Side(true),
    0,
  );
  await Claims.connect(Signer(7)).createPropose(
    Claim(1),
    Amount(20_000_000_000),
    Side(true),
    0,
  );
  await Claims.connect(Signer(8)).createPropose(
    Claim(1),
    Amount(30_000_000_000),
    Side(true),
    0,
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).grantRole(Role("BOT_ROLE"), Address(7));

  await Claims.connect(Signer(7)).createResolve(
    Claim(1),
    Claim(7),
    [0, MAX], // address 4 and 1
    Expiry(7, "days"),
  );

  await Claims.connect(Signer(4)).updateResolve(
    Claim(1),
    Side(false),
  );

  await Claims.connect(Signer(1)).updateResolve(
    Claim(1),
    Side(false),
  );

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(14, "days")]); // 7 days + challenge
  await network.provider.send("evm_mine");

  await Claims.connect(Signer(0)).updateBalance(
    Claim(1),
    100,
  );

  return { Address, Claims, Signer, Token };
};
