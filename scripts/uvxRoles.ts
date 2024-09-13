import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

//
//     npx hardhat run ./scripts/uvxRoles.ts --network localhost
//
const main = async () => {
  const UVX = await ethers.getContractAt("UVX", "0x04Ec0582e2700Db583e3BCb9b913D181Ac2D68A8");

  try {
    console.log("UVX owner:    ", await UVX.owner());

    {
      const len = await UVX.getRoleMemberCount(Role("BOT_ROLE"));
      for (let i = 0; i < len; i++) {
        console.log("UVX bot:      ", await UVX.getRoleMember(Role("BOT_ROLE"), i));
      }
    }

    {
      const len = await UVX.getRoleMemberCount(Role("CONTRACT_ROLE"));
      for (let i = 0; i < len; i++) {
        console.log("UVX contract: ", await UVX.getRoleMember(Role("CONTRACT_ROLE"), i));
      }
    }

    {
      const len = await UVX.getRoleMemberCount(Role("TOKEN_ROLE"));
      for (let i = 0; i < len; i++) {
        console.log("UVX token:    ", await UVX.getRoleMember(Role("TOKEN_ROLE"), i));
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
