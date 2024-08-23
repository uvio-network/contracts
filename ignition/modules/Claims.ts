import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Module = buildModule("Claims", (m) => {
  return { claims: m.contract("Claims") };
});

export default Module;
