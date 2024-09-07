// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Stablecoin is ERC20 {
    uint8 private _decimals;

    constructor(uint8 dec) ERC20("Stablecoin", "STBL") {
        _decimals = dec;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address dst, uint256 bal) public {
        _mint(dst, bal);
    }
}
