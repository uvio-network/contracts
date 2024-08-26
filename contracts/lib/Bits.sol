// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library Bits {
    struct Map {
        // _int is the limited data matrix for this minimal bitmap
        // implementation. Note that the maximum capacity per bitmap instance is
        // only 8 bits wide, which only covers indices 0 - 7.
        uint8 _int;
    }

    // get expresses whether the bit at the given index is set. Note that only
    // indices 0 - 7 are valid to be used. Using indices >= 8 is a no-op and
    // will always return false.
    function get(Map storage map, uint8 ind) internal view returns (bool) {
        uint8 msk = uint8(1 << (ind & 0xff));
        return map._int & msk != 0;
    }

    // set activates the bit at the given index. Note that only indices 0 - 7
    // are valid to be used. Using indices >= 8 is a no-op and will never set
    // any bit.
    function set(Map storage map, uint8 ind) internal {
        uint8 msk = uint8(1 << (ind & 0xff));
        map._int |= msk;
    }
}
