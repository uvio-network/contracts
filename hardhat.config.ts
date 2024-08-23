import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: true,
    noColors: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
};

export default config;
