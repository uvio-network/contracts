// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IRouterCalls} from "./interfaces/IRouterCalls.sol";

import "../script/Deploy.s.sol";

import "forge-std/Test.sol";

abstract contract Base is Deploy, Test {

    address public alice;
    address public bob;
    address public yossi;

    IRouterCalls internal _router;

    function setUp() public virtual {
        vm.selectFork(vm.createFork(vm.envString("MAINNET_RPC_URL")));

        run(); // deploy and initialize contracts

        alice = _createUser("alice");
        bob = _createUser("bob");
        yossi = _createUser("yossi");

        _router = IRouterCalls(address(router));
    }

    function _createUser(string memory _name) internal returns (address payable) {
        address payable _user = payable(makeAddr(_name));
        vm.deal({ account: _user, newBalance: 100 ether });
        deal({ token: asset, to: _user, give: 1_000 ether });
        return _user;
    }
}