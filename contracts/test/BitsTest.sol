// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../lib/Bits.sol";

contract BitsTest {
    using Bits for Bits.Map;

    mapping(uint256 => Bits.Map) private _map;

    function get(uint256 cla, uint8 ind) external view returns (bool) {
        return _map[cla].get(ind);
    }

    function set(uint256 cla, uint8 ind) external {
        _map[cla].set(ind);
    }
}
