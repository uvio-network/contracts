// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {DataTypes} from "../src/utils/DataTypes.sol";

import {IStorage} from "../src/interfaces/IStorage.sol";

import "../script/Deploy.s.sol";

import "forge-std/Test.sol";

abstract contract Base is Deploy, Test {

    address public alice;
    address public bob;
    address public yossi;
    address public notWhitelistedUser;

    IMarket internal _router;

    function setUp() public virtual {
        uint256 _blockNumber = 20428430;
        vm.selectFork(vm.createFork(vm.envString("MAINNET_RPC_URL"), _blockNumber));

        run(); // deploy and initialize contracts

        alice = _createUser("alice");
        bob = _createUser("bob");
        yossi = _createUser("yossi");
        notWhitelistedUser = _createUser("notWhitelistedUser");
    }

    // ==============================================================
    // Internal helpers
    // ==============================================================

    function _createUser(string memory _name) internal returns (address payable) {
        address payable _user = payable(makeAddr(_name));
        vm.deal({ account: _user, newBalance: 10_000 ether });
        deal({ token: asset, to: _user, give: 10_000 ether });
        return _user;
    }

    function _deposit(address _user, uint256 _amount) internal {
        vm.startPrank(_user);
        IERC20(asset).approve(address(s), _amount);
        s.deposit(_amount, _user);
        vm.stopPrank();
    }

    function _getMarketMinStake(uint256 _claimId) internal view returns (uint256) {
        uint256 _marketMinStake = MIN_STAKE;
        if (_claimId > 0) {
            for (uint256 i = 0; i < _claimId; i++) {
                _marketMinStake *= (claimMarket.PRECISION() + claimMarket.minStakeIncrease()) / claimMarket.PRECISION();
            }
        }
        return _marketMinStake;
    }
}