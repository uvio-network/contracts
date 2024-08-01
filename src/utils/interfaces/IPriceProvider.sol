// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../DataTypes.sol";

interface IPriceProvider {
    function checkPriceParams(DataTypes.Price calldata _price) external pure returns (bool);
    function getPrice(DataTypes.Price calldata _price, uint256 _timeElapsed, uint256 _duration) external pure returns (uint256);
}