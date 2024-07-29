// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMarket} from "../../src/interfaces/IMarket.sol";

interface IRouterCalls {
    function propose(IMarket.Propose memory _propose) external payable;
}