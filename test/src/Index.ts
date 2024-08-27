import { maxUint256 } from "viem";

// Index returns the position of staker addresses on either side of the market.
// If ind is positive, then the implied staking address refers to a user who
// voted true. If ind is negative, then the implied staking address refers to a
// user who voted false.
export const Index = (ind: number): bigint => {
  if (ind > 0) return BigInt(ind);
  if (ind < 0) return maxUint256 + BigInt(ind);
  throw "index must not be 0";
};
