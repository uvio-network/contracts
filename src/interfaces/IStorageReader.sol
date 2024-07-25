// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IStorage} from "./IStorage.sol";

interface IStorageReader is IStorage {

    function claims(uint256 _marketId) external view returns (Claim[] memory);
    function marketId() external view returns (uint256);
}