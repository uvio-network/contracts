import { Address } from "viem";
import { Amount } from "./Amount";
import { Claim } from "./Claim";
import { ethers } from "hardhat";
import { Expiry } from "./Expiry";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { network } from "hardhat";
import { Side } from "./Side";

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
}

export const CreatePropose16Expired = async () => {
  const { Address, Balance, Claims, Signer } = await loadFixture(CreatePropose16);

  await network.provider.send("evm_setNextBlockTimestamp", [Expiry(3, "days")]);
  await network.provider.send("evm_mine");

  return { Address, Balance, Claims, Signer };
}
