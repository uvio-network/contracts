// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Base.sol";

contract WithdrawTest is Base {

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Tests
    // ==============================================================

    function testWithdraw(uint256 _amount, address _reciever) public {
        vm.assume(_amount > 0 && _amount < 100 ether && _reciever != address(0) && _reciever != address(this));

        uint256 _recieverBalanceBefore = IERC20(asset).balanceOf(_reciever);

        _deposit(alice, _amount);

        vm.startPrank(alice);
        m.withdraw(_amount, asset, _reciever);

        assertEq(m.userBalance(asset, alice), 0, "testWithdraw: E1");
        assertEq(IERC20(asset).balanceOf(_reciever), _recieverBalanceBefore + _amount, "testWithdraw: E2");
    }

    function testAssetNotWhitelisted(address _notWhitelistedAsset) public {
        vm.assume(_notWhitelistedAsset != asset);

        vm.startPrank(alice);
        vm.expectRevert(IMarkets.AssetNotWhitelisted.selector);
        m.withdraw(1 ether, _notWhitelistedAsset, alice);
    }

    function testWithdrawZeroAmount(address _reciever) public {
        vm.assume(_reciever != address(0) && _reciever != address(this));

        _deposit(alice, 1 ether);

        vm.startPrank(alice);
        vm.expectRevert(IMarkets.ZeroAmount.selector);
        m.withdraw(0, asset, _reciever);
    }

    function testWithdrawInvalidAddressZeroAddress(uint256 _amount) public {
        vm.assume(_amount > 0 && _amount < 100 ether);

        _deposit(alice, _amount);

        vm.startPrank(alice);
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.withdraw(_amount, asset, address(0));
    }

    function testWithdrawInvalidAddressThisAddress(uint256 _amount) public {
        vm.assume(_amount > 0 && _amount < 100 ether);

        _deposit(alice, _amount);

        vm.startPrank(alice);
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.withdraw(_amount, asset, address(m));
    }
}