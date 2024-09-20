import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

//
//     npx hardhat run ./scripts/uvxRoles.ts --network localhost
//
const main = async () => {
  const UVX = await ethers.getContractAt("UVX", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

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
