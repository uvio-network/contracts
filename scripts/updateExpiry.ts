import { ethers } from "hardhat";

// DEPLOYER_PRIVATE_KEY is well known the Hardhat/Anvil deployer.
const DEPLOYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

//
//     npx hardhat run ./scripts/updateExpiry.ts --network localhost
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);
  const pro = 1726927374511731;
  const exp = 1726927560;

  try {
    const bef = await Claims.connect(wal).searchExpired(pro);
    console.log("bef", bef)

    await Claims.connect(wal).updateExpiry(pro, exp);

    const aft = await Claims.connect(wal).searchExpired(pro);
    console.log("aft", aft)
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
