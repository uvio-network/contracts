// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../DataTypes.sol";

interface IPriceProvider {

    // ==============================================================
    // State variables
    // ==============================================================

    function MAX_HALVES() external view returns (uint256);
    function PRICE_PRECISION() external view returns (uint256);

    // ==============================================================
    // Views
    // ==============================================================

    function checkPriceParams(DataTypes.Price calldata _price) external pure returns (bool);
    function getPrice(DataTypes.Price calldata _price, uint256 _timeElapsed, uint256 _duration) external pure returns (uint256);
    function getExponentialPrice(uint256 _numHalves, uint256 _timeElapsed, uint256 _duration) external pure returns (uint256);

    // ==============================================================
    // Errors
    // ==============================================================

    error InvalidCurveType();
}