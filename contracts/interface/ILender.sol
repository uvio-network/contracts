// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILender {
    function lend(address rec, address tk1, address tk2, uint256 bl1) external;
}
