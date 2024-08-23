import { parseUnits } from "viem";

export const Amount = (num: number): bigint => {
  return parseUnits(num.toString(), 18);
};
