import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

//
//     npx hardhat run ./scripts/claimsRoles.ts --network localhost
//
const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  try {
    console.log("Claims owner:    ", await Claims.owner());

    {
      const len = await Claims.getRoleMemberCount(Role("BOT_ROLE"));
      for (let i = 0; i < len; i++) {
        console.log("Claims bot:      ", await Claims.getRoleMember(Role("BOT_ROLE"), i));
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
