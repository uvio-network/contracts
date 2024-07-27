// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IStorage} from "./IStorage.sol";

interface INullifyMarket {
    function status(uint256 _refMarketId) external view returns (IStorage.ClaimStatus);
}