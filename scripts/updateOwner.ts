import { ethers } from "hardhat";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

//
//     npx hardhat run ./scripts/updateOwner.ts --network localhost
//
const main = async () => {
  const UVX = await ethers.getContractAt("UVX", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);
  const own = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  try {
    await UVX.connect(wal).updateOwner(own);
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
