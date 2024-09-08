// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStablecoin {
    function burn(address dst, uint256 bal) external;
    function mint(address dst, uint256 bal) external;
}
