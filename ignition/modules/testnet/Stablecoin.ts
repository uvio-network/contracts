import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/testnet/Stablecoin.ts --network base-sepolia
//
const Module = buildModule("Stablecoin", (m) => {
  return { Stablecoin: m.contract("Stablecoin", [6]) };
});

export default Module;
