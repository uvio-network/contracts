import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/UVX.ts --network localhost
//
const Module = buildModule("UVX", (m) => {
  return { UVX: m.contract("UVX", ["0xEFb36B2D443C5A6Ff4127cDa30944A12B421b9C2", "0x7FC9a5730381DdF44C7D762d82A4aabC90fAE786"]) };
});

export default Module;
