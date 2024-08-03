// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IPriceProvider} from "./interfaces/IPriceProvider.sol";

import {DataTypes} from "./DataTypes.sol";

contract PriceProvider is IPriceProvider {

    uint256 public constant MIN_HALVES = 1;
    uint256 public constant MAX_HALVES = 10;
    uint256 public constant PRICE_PRECISION = 1 ether;

    function checkPriceParams(DataTypes.Price calldata _price) external pure returns (bool) {
        if (_price.curveType != 0 || _price.steepness < MIN_HALVES || _price.steepness > MAX_HALVES) return false;
        return true;
    }

    function getPrice(DataTypes.Price calldata _price, uint256 _timeElapsed, uint256 _duration) external pure returns (uint256) {
        if (_price.curveType == 0) {
            return getExponentialPrice(_price.steepness, _timeElapsed, _duration);
        } else {
            revert InvalidCurveType();
        }
    }

    function getExponentialPrice(uint256 _numHalves, uint256 _timeElapsed, uint256 _duration) public pure returns (uint256) {
        uint256 _price = PRICE_PRECISION;
        uint256 _halfLife = _duration / _numHalves;
        _price >>= (_timeElapsed / _halfLife);
        _timeElapsed %= _halfLife;
        return _price - _price * _timeElapsed / _halfLife / 2;
    }
}