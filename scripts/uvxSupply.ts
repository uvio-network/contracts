import { ethers } from "hardhat";
import { formatUnits } from "viem";

//
//     npx hardhat run ./scripts/uvxSupply.ts --network localhost
//
const main = async () => {
  const UVX = await ethers.getContractAt("UVX", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

  try {
    const tot = await UVX.totalSupply();
    const sym = await UVX.symbol();
    console.log(sym, "Total Supply:", formatUnits(tot, 18));
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
