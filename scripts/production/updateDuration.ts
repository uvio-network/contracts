import { ethers } from "hardhat";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

//
//     npx hardhat run ./scripts/production/updateDuration.ts --network base-sepolia
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x537cE8e9F4Cce5a1D8033B63f274187157a966b3");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);

  try {
    await Claims.connect(wal).updateDuration(
      250,              // 2.5%
      60 * 60 * 24 * 7, // 7 days
      60 * 60 * 1,      // 60 minutes
    );
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
