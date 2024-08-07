// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "../Base.sol";

contract OwnerTest is Base {

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Tests
    // ==============================================================

    function testDepositAfterDisableWhitelist() public {
        vm.prank(deployer);
        m.disableWhitelist();

        _deposit(notWhitelistedUser, 1 ether);
    }
    function testDisableWhitelist() public {
        vm.prank(deployer);
        m.disableWhitelist();
        assertTrue(!m.isWhitelistActive());
    }

    function testDisableWhitelistNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.disableWhitelist();
    }

    function testWhitelistUser() public {
        vm.prank(deployer);
        m.whitelistUser(notWhitelistedUser);
        assertTrue(m.userWhitelisted(notWhitelistedUser));
    }

    function testWhitelistUserNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.whitelistUser(notWhitelistedUser);
    }

    function testWhitelistWhitelistDisabled() public {
        vm.prank(deployer);
        m.disableWhitelist();
        vm.expectRevert(IMarkets.WhitelistDisabled.selector);
        vm.prank(deployer);
        m.whitelistUser(notWhitelistedUser);
    }

    function testSetMinStake(uint256 _minStake) public {
        vm.assume(_minStake > 0);
        vm.prank(deployer);
        m.setMinStake(_minStake);
        assertEq(m.minStake(), _minStake);
    }

    function testSetMinStakeZero() public {
        vm.expectRevert(IMarkets.InvalidAmount.selector);
        vm.prank(deployer);
        m.setMinStake(0);
    }

    function testSetMinStakeNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setMinStake(1 ether);
    }

    function testSetMinStakeIncrease(uint256 _minStakeIncrease) public {
        vm.prank(deployer);
        m.setMinStakeIncrease(_minStakeIncrease);
        assertEq(m.minStakeIncrease(), _minStakeIncrease);
    }

    function testSetMinStakeIncreaseNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setMinStakeIncrease(1 ether);
    }

    function testSetMinClaimDuration(uint40 _minClaimDuration) public {
        vm.assume(_minClaimDuration > m.MIN_CLAIM_DURATION());
        vm.prank(deployer);
        m.setMinClaimDuration(_minClaimDuration);
        assertEq(m.minClaimDuration(), _minClaimDuration);
    }

    function testSetMinClaimDurationLessThanMin(uint40 _invalidDuration) public {
        vm.assume(_invalidDuration < m.MIN_CLAIM_DURATION());
        vm.expectRevert(IMarkets.InvalidDuration.selector);
        vm.prank(deployer);
        m.setMinClaimDuration(_invalidDuration);
    }

    function testSetMinClaimDurationNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setMinClaimDuration(1);
    }

    function testSetVotingDuration(uint40 _votingDuration) public {
        vm.assume(_votingDuration > m.MIN_VOTING_DURATION());
        vm.prank(deployer);
        m.setVotingDuration(_votingDuration);
        assertEq(m.votingDuration(), _votingDuration);
    }

    function testSetVotingDurationLessThanMin(uint40 _invalidDuration) public {
        vm.assume(_invalidDuration < m.MIN_VOTING_DURATION());
        vm.expectRevert(IMarkets.InvalidDuration.selector);
        vm.prank(deployer);
        m.setVotingDuration(_invalidDuration);
    }

    function testSetVotingDurationNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setVotingDuration(1);
    }

    function testSetDisputeDuration(uint40 _disputeDuration) public {
        vm.assume(_disputeDuration > m.MIN_DISPUTE_DURATION());
        vm.prank(deployer);
        m.setDisputeDuration(_disputeDuration);
        assertEq(m.disputeDuration(), _disputeDuration);
    }

    function testSetDisputeDurationLessThanMin(uint40 _invalidDuration) public {
        vm.assume(_invalidDuration < m.MIN_DISPUTE_DURATION());
        vm.expectRevert(IMarkets.InvalidDuration.selector);
        vm.prank(deployer);
        m.setDisputeDuration(_invalidDuration);
    }

    function testSetDisputeDurationNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setDisputeDuration(1);
    }

    function testSetFee(uint256 _fee) public {
        vm.assume(_fee <= m.MAX_FEE());
        vm.prank(deployer);
        m.setFee(_fee);
        assertEq(m.fee(), _fee);
    }

    function testSetFeeGreaterThanMax(uint256 _invalidFee) public {
        vm.assume(_invalidFee > m.MAX_FEE());
        vm.expectRevert(IMarkets.InvalidFee.selector);
        vm.prank(deployer);
        m.setFee(_invalidFee);
    }

    function testSetFeeNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setFee(1);
    }

    function testSetProposerFee(uint256 _proposerFee) public {
        vm.assume(_proposerFee <= m.PRECISION());
        vm.prank(deployer);
        m.setProposerFee(_proposerFee);
        assertEq(m.proposerFee(), _proposerFee);
    }

    function testSetProposerFeeGreaterThanMax(uint256 _invalidFee) public {
        vm.assume(_invalidFee > m.PRECISION());
        vm.expectRevert(IMarkets.InvalidFee.selector);
        vm.prank(deployer);
        m.setProposerFee(_invalidFee);
    }

    function testSetProposerFeeNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setProposerFee(1);
    }

    function testSetRandomizer(address _randomizer) public {
        vm.assume(_randomizer != address(0));
        vm.prank(deployer);
        m.setRandomizer(_randomizer);
        assertEq(m.randomizer(), _randomizer);
    }

    function testSetRandomizerZero() public {
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        vm.prank(deployer);
        m.setRandomizer(address(0));
    }

    function testSetRandomizerNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setRandomizer(deployer);
    }

    function testSetPriceProvider(address _priceProvider) public {
        vm.assume(_priceProvider != address(0));
        vm.prank(deployer);
        m.setPriceProvider(_priceProvider);
        assertEq(address(m.priceProvider()), address(_priceProvider));
    }

    function testSetPriceProviderZero() public {
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        vm.prank(deployer);
        m.setPriceProvider(address(0));
    }

    function testSetPriceProviderNotOwner() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(this)));
        m.setPriceProvider(deployer);
    }
}