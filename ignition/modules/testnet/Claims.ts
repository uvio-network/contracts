import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/testnet/Claims.ts --network base-sepolia
//
const Module = buildModule("Claims", (m) => {
  return { Claims: m.contract("Claims", ["0xEFb36B2D443C5A6Ff4127cDa30944A12B421b9C2", "0x484C32b1288A88A48F8e7D20173a1048589Df182"]) };
});

export default Module;
