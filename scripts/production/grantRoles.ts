import { ethers } from "hardhat";
import { Role } from "../../test/src/Role";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

//
//     npx hardhat run ./scripts/production/grantRoles.ts --network base-sepolia
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x537cE8e9F4Cce5a1D8033B63f274187157a966b3");
  const UVX = await ethers.getContractAt("UVX", "0x484C32b1288A88A48F8e7D20173a1048589Df182");

  const wal = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, ethers.provider);

  // Note, for some reason the roles have to be granted in separate calls, one
  // by one.
  try {
    // Allow the apiserver signer to resolve claims.
    await Claims.connect(wal).grantRole(Role("BOT_ROLE"), "0x52378bd0Fd701930F825a4Aa789ECEF0E4e57deF");

    // Allow the apiserver signer to mint UVX tokens.
    // await UVX.connect(wal).grantRole(Role("BOT_ROLE"), "0x52378bd0Fd701930F825a4Aa789ECEF0E4e57deF");

    // Allow UVX tokens to be transferred across the Claims contract.
    // await UVX.connect(wal).grantRole(Role("CONTRACT_ROLE"), "0x537cE8e9F4Cce5a1D8033B63f274187157a966b3");
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
