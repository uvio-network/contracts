// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../utils/DataTypes.sol";

interface INullifyMarket {
    function status(uint256 _refMarketId) external view returns (DataTypes.ClaimStatus);
}