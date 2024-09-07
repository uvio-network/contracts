// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Stablecoin is ERC20 {
    error Deployment(string why);

    uint8 private _decimals;

    constructor(uint8 dec) ERC20("Stablecoin", "STBL") {
        if (dec == 0) {
            revert Deployment("decimals empty");
        }

        {
            _decimals = dec;
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address dst, uint256 bal) public {
        _mint(dst, bal);
    }
}
