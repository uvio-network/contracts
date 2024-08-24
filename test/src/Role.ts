import { Hex } from "viem";
import { keccak256 } from "viem";
import { stringToBytes } from "viem";

export const Role = (rol: string): Hex => {
  return keccak256(stringToBytes(rol));
};
