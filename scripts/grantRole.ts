import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

//
//     npx hardhat run ./scripts/grantRole.ts --network localhost
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  const DEPLOYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);
  const add = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  try {
    await Claims.connect(wal).grantRole(Role("BOT_ROLE"), add);
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
