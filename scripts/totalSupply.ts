import { ethers } from "hardhat";
import { formatUnits } from "viem";

const main = async () => {
  const Stablecoin = await ethers.getContractAt("Stablecoin", "0x7FC9a5730381DdF44C7D762d82A4aabC90fAE786");

  try {
    const tot = await Stablecoin.totalSupply();
    console.log("Total Supply:", formatUnits(tot, 6));
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
