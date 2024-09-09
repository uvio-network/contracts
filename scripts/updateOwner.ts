import { ethers } from "hardhat";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0xc4E6559DBc61f59C713d8d6CD7a819c429Df076a");
  const UVX = await ethers.getContractAt("UVX", "0xbf924c7081951a52c54836CB05637D8c4C77502d");

  const own = "0xEFb36B2D443C5A6Ff4127cDa30944A12B421b9C2";

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);

  try {
    await Claims.connect(wal).updateOwner(own);
    await UVX.connect(wal).updateOwner(own);
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
