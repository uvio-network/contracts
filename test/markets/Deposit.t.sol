// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Base.sol";

contract DepositTest is Base {

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Tests
    // ==============================================================

    function testDeposit(uint256 _amount, address _reciever) public {
        vm.assume(_amount > 0 && _amount < 100 ether && _reciever != address(0) && _reciever != address(this));

        vm.prank(deployer);
        m.whitelistUser(_reciever);
        assertTrue(m.userWhitelisted(_reciever));

        vm.startPrank(alice);
        IERC20(asset).approve(address(m), _amount);
        m.deposit(_amount, _reciever);
        vm.stopPrank();

        assertEq(m.totalAssets(), _amount);
        assertEq(m.userBalance(_reciever), _amount);
        assertEq(IERC20(asset).balanceOf(address(m)), _amount);
    }

    function testDepositNotWhitelisted(uint256 _amount) public {
        vm.assume(_amount > 0 && _amount < 100 ether);

        vm.startPrank(alice);
        IERC20(asset).approve(address(m), _amount);
        vm.expectRevert(IMarkets.NotWhitelisted.selector);
        m.deposit(_amount, notWhitelistedUser);
        vm.stopPrank();
    }

    function testDepositZeroAmount(address _reciever) public {
        vm.assume(_reciever != address(0) && _reciever != address(this));

        vm.prank(deployer);
        m.whitelistUser(_reciever);

        vm.prank(alice);
        vm.expectRevert(IMarkets.ZeroAmount.selector);
        m.deposit(0, _reciever);
    }

    function testDepositInvalidAddressZeroAddress(uint256 _amount) public {
        vm.assume(_amount > 0 && _amount < 100 ether);

        vm.prank(deployer);
        m.disableWhitelist();

        vm.startPrank(alice);
        IERC20(asset).approve(address(m), _amount);
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.deposit(_amount, address(0));
    }

    function testDepositInvalidAddressThis(uint256 _amount) public {
        vm.assume(_amount > 0 && _amount < 100 ether);

        vm.prank(deployer);
        m.disableWhitelist();

        vm.startPrank(alice);
        IERC20(asset).approve(address(m), _amount);
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.deposit(_amount, address(m));
    }
}