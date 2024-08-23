import { Address } from "viem";
import { Amount } from "./Amount";
import { ethers } from "hardhat";

export const Deploy = async () => {
  const tok = await ethers.deployContract("Token");
  const cla = await ethers.deployContract("Claims", [await tok.getAddress()]);
  const sig = await ethers.getSigners();

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
