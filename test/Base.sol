// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../script/Deploy.s.sol";

import "forge-std/Test.sol";

abstract contract Base is Deploy, Test {

    uint256 public marketId = 1;

    address public alice;
    address public bob;
    address public yossi;
    address public notWhitelistedUser;

    function setUp() public virtual {
        // uint256 _blockNumber = 20428430;
        // vm.selectFork(vm.createFork(vm.envString("MAINNET_RPC_URL"), _blockNumber));
        vm.selectFork(vm.createFork(vm.envString("ARBITRUM_SEPOLIA_RPC_URL")));

        run(); // deploy and initialize contracts

        alice = _createUser("alice");
        bob = _createUser("bob");
        yossi = _createUser("yossi");
        notWhitelistedUser = _createUser("notWhitelistedUser");

        vm.startPrank(deployer);
        m.whitelistUser(alice);
        m.whitelistUser(bob);
        m.whitelistUser(yossi);
        vm.stopPrank();

        vm.prank(alice);
        IERC20(asset).approve(address(m), type(uint256).max);
        vm.prank(bob);
        IERC20(asset).approve(address(m), type(uint256).max);
        vm.prank(yossi);
        IERC20(asset).approve(address(m), type(uint256).max);
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
        IERC20(asset).approve(address(m), _amount);
        m.deposit(_amount, asset, _user);
        vm.stopPrank();
    }

    function _getMarketMinStake(uint256 _claimId) internal view returns (uint256) {
        uint256 _marketMinStake = MIN_STAKE;
        if (_claimId > 0)
            for (uint256 i = 0; i < _claimId; ++i)
                _marketMinStake *= (m.PRECISION() + m.minStakeIncrease()) / m.PRECISION();

        return _marketMinStake;
    }

    function _propose(uint256 _amount) internal {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        _deposit(alice, _amount);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _amount,
            asset,
            uint40(block.timestamp) + MIN_CLAIM_DURATION + m.MIN_STAKE_FREEZE_DURATION(), // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            true, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        m.propose(propose_);
    }

    function _stake(uint256 _amount, address _user, bool _yea) internal {
        _deposit(_user, _amount);

        vm.prank(_user);
        m.stake(marketId, _amount, _yea);
    }

    function _prepareVote(uint256 _expiration) internal {
        skip(_expiration - block.timestamp);
        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = bob;
        vm.prank(deployer);
        randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);
    }

    function _vote(address _user, bool _yea, bool stake_) internal {
        vm.prank(_user);
        m.vote(marketId, _yea, stake_);
    }

    function _endVote(uint256 _expiration) internal {
        skip(_expiration - block.timestamp);
        m.endVote(marketId);
    }

    function _resolve(uint256 _expiration) internal {
        skip(_expiration - block.timestamp);
        m.resolve(marketId);
    }
}