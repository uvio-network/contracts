import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

//
//     npx hardhat ignition deploy ./ignition/modules/UVX.ts --network localhost
//
const Module = buildModule("UVX", (m) => {
  return { UVX: m.contract("UVX", ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x5FbDB2315678afecb367f032d93F642f64180aa3"]) };
});

export default Module;
