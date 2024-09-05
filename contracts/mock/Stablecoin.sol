// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Stablecoin is ERC20 {
    constructor() ERC20("Stablecoin", "STBL") {}

    function mint(address dst, uint256 bal) public {
        _mint(dst, bal);
    }
}
