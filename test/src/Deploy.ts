import { ethers } from "hardhat";
import { Address } from "viem";

export const Deploy = async () => {
  const tok = await ethers.deployContract("Token");
  const cla = await ethers.deployContract("Claims", [await tok.getAddress()]);
  const sig = await ethers.getSigners();

  return {
    Address: (ind: number): Address => {
      return sig[ind].address as Address;
    },
    Claims: cla,
    Signer: (ind: number) => {
      return sig[ind];
    },
    Token: tok,
  };
};
