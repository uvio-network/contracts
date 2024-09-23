import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

// DEPLOYER_PRIVATE_KEY is well known the Hardhat/Anvil deployer.
const DEPLOYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

//
//     npx hardhat run ./scripts/grantRoles.ts --network localhost
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  const UVX = await ethers.getContractAt("UVX", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);

  try {
    // Allow the deployer to resolve claims.
    await Claims.connect(wal).grantRole(Role("BOT_ROLE"), "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // Allow the deployer to mint UVX tokens.
    await UVX.connect(wal).grantRole(Role("BOT_ROLE"), "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // Allow UVX tokens to be transferred across the Claims contract.
    await UVX.connect(wal).grantRole(Role("CONTRACT_ROLE"), "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
