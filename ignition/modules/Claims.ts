import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/Claims.ts --network localhost
//
const Module = buildModule("Claims", (m) => {
  return { Claims: m.contract("Claims", ["0xEFb36B2D443C5A6Ff4127cDa30944A12B421b9C2", "0x04Ec0582e2700Db583e3BCb9b913D181Ac2D68A8"]) };
});

export default Module;
