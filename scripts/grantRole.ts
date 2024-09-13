import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

//
//     npx hardhat run ./scripts/grantRole.ts --network localhost
//
const main = async () => {
  const UVX = await ethers.getContractAt("UVX", "0x04Ec0582e2700Db583e3BCb9b913D181Ac2D68A8");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);
  const add = "0x48455E0c620D46239BE9358C9B2Bd6D0bf1F3AA6";

  try {
    await UVX.connect(wal).grantRole(Role("CONTRACT_ROLE"), add);
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
