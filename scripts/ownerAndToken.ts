import { ethers } from "hardhat";
import { Role } from "../test/src/Role";

const main = async () => {
  const Claims = await ethers.getContractAt("Claims", "0xc4E6559DBc61f59C713d8d6CD7a819c429Df076a");
  const UVX = await ethers.getContractAt("UVX", "0xbf924c7081951a52c54836CB05637D8c4C77502d");

  try {
    console.log("Claims owner:", await Claims.owner());
    console.log("Claims token:", await Claims.token());
    console.log("");
    console.log("UVX owner:   ", await UVX.owner());

    const len = await UVX.getRoleMemberCount(Role("TOKEN_ROLE"));
    for (let i = 0; i < len; i++) {
      console.log("UVX token:   ", await UVX.getRoleMember(Role("TOKEN_ROLE"), i));
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
