// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library Bits {
    struct Map {
        uint8 _int;
    }

    function get(Map storage map, uint8 ind) internal view returns (bool) {
        uint8 msk = uint8(1 << (ind & 0xff));
        return map._int & msk != 0;
    }

    function set(Map storage map, uint8 ind) internal {
        uint8 msk = uint8(1 << (ind & 0xff));
        map._int |= msk;
    }
}
