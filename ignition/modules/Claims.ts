import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/Claims.ts --network localhost
//
const Module = buildModule("Claims", (m) => {
  return { Claims: m.contract("Claims", ["0xEFb36B2D443C5A6Ff4127cDa30944A12B421b9C2", "0xbf924c7081951a52c54836CB05637D8c4C77502d"]) };
});

export default Module;
