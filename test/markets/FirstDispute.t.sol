// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Base.sol";

contract FirstDisputeTest is Base {

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Propose
    // ==============================================================

    function testProposeFirstDispute(uint256 _amount, uint256 _secondAmount) public {
        _getToFirstDisputePeriod(_amount);

        uint256 _claimId = m.claimsLength(marketId);
        vm.assume(_secondAmount >= _getMarketMinStake(_claimId) && _secondAmount < 100 ether);

        _deposit(alice, _secondAmount);

        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(asset, alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _marketsBalanceBefore = IERC20(asset).balanceOf(address(m));

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _secondAmount, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        m.propose(propose_);

        assertEq(m.userBalance(asset, alice), _userBalanceBalanceBefore - _secondAmount, "testProposeFirstDispute: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore + _secondAmount, "testProposeFirstDispute: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _marketsBalanceBefore, "testProposeFirstDispute: E2");
        assertEq(m.claimsLength(marketId), _claimId + 1, "testProposeFirstDispute: E3");
        assertEq(m.nullifiedMarkets(marketId), 0, "testProposeFirstDispute: E4");
        assertEq(m.marketMinStake(marketId), _getMarketMinStake(_claimId), "testProposeFirstDispute: E5");
        assertEq(m.claims(marketId)[_claimId].metadataURI, "metadataURI", "testProposeFirstDispute: E6");
        assertEq(m.claims(marketId)[_claimId].expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeFirstDispute: E7");
        assertEq(m.claims(marketId)[_claimId].proposer, alice, "testProposeFirstDispute: E8");
        assertEq(m.claims(marketId)[_claimId].isNullifyMarket, false, "testProposeFirstDispute: E9");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _secondAmount, "testProposeFirstDispute: E10");
        assertEq(m.claims(marketId)[_claimId].stake.nay, 0, "testProposeFirstDispute: E11");
        assertEq(m.claims(marketId)[_claimId].stake.expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeFirstDispute: E12");
        assertEq(m.claims(marketId)[_claimId].stake.start, uint40(block.timestamp), "testProposeFirstDispute: E13");
        assertEq(m.claims(marketId)[_claimId].stake.price.steepness, 0, "testProposeFirstDispute: E14");
        assertEq(m.claims(marketId)[_claimId].stake.price.curveType, 0, "testProposeFirstDispute: E15");
        assertEq(m.claims(marketId)[_claimId].vote.yea, 0, "testProposeFirstDispute: E16");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 0, "testProposeFirstDispute: E17");
        assertEq(m.claims(marketId)[_claimId].vote.disputeExpiration, 0, "testProposeFirstDispute: E18");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters.length, 0, "testProposeFirstDispute: E19");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters.length, 0, "testProposeFirstDispute: E20");
        assertEq(uint8(m.claims(marketId)[_claimId].vote.outcome), uint8(IMarkets.Outcome.None), "testProposeFirstDispute: E21");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.Active), "testProposeFirstDispute: E22");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testProposeFirstDispute: E23");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testProposeFirstDispute: E24");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 0, "testProposeFirstDispute: E25");
    }

    function testProposeFirstDisputeInvalidMarketId(uint256 _invalidMarketId) public {
        vm.assume(_invalidMarketId > marketId || _invalidMarketId == 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            _invalidMarketId,
            0, // nullifyMarketId
            _minStake, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidMarketId.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeInvalidNullifyMarketId(uint256 _nullifyMarketId) public {
        vm.assume(_nullifyMarketId > 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            _nullifyMarketId,
            _minStake, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidNullifyMarketId.selector);
        m.propose(propose_);
    }
    function testProposeFirstDisputeInvalidPriceParamsSteepnessNotZero(uint256 _invalidSteepness) public {
        vm.assume(_invalidSteepness > 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _minStake, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, _invalidSteepness)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidPriceParams.selector);
        m.propose(propose_);
    }
    function testProposeFirstDisputeInvalidPriceParamsCurveTypeNotZero(uint8 _invalidCurveType) public {
        vm.assume(_invalidCurveType > 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _minStake, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(_invalidCurveType, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidPriceParams.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeInvalidClaimExpiration(uint40 _invalidClaimExpiration) public {
        vm.assume(_invalidClaimExpiration > 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _minStake, // amount
            address(0), // asset
            _invalidClaimExpiration, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidExpiration.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeInvalidStakeExpiration(uint40 _invalidStakeExpiration) public {
        vm.assume(_invalidStakeExpiration > 0);

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _minStake, // amount
            address(0), // asset
            0, // claimExpiration
            _invalidStakeExpiration, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidExpiration.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeInvalidInvalidAddress(address _invalidAsset) public {
        vm.assume(_invalidAsset != address(0));

        _getToFirstDisputePeriod(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId);
        uint256 _minStake = _getMarketMinStake(_claimId);
        _deposit(alice, _minStake);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _minStake, // amount
            _invalidAsset, // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeNotDisputePeriodTooEarly() public {

        _propose(MIN_STAKE);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            MIN_STAKE, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.NotDisputePeriod.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeNotDisputePeriodTooLate() public {

        _getToFirstDisputePeriod(MIN_STAKE);
        uint256 _expiration = m.claims(marketId)[m.claimsLength(marketId) - 1].vote.disputeExpiration;
        _resolve(_expiration);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            MIN_STAKE, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.NotDisputePeriod.selector);
        m.propose(propose_);
    }

    function testProposeFirstDisputeInvalidAmount() public {

        _getToFirstDisputePeriod(MIN_STAKE);

        IMarkets.Propose memory propose_ = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            MIN_STAKE, // amount
            address(0), // asset
            0, // claimExpiration
            0, // stakingExpiration
            true, // yea
            true, // dispute
            IMarkets.Price(0, 0)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidAmount.selector);
        m.propose(propose_);
    }

    // ==============================================================
    // Resolve
    // ==============================================================

    function testResolveFirstDispute(uint256 _amount, uint256 _secondAmount) public {
        testProposeFirstDispute(_amount, _secondAmount);

        vm.expectRevert(IMarkets.NotPendingResolution.selector);
        m.resolve(marketId);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        _stake(_getMarketMinStake(_claimId), bob, false);
        _stake(_getMarketMinStake(_claimId), yossi, false);
        _prepareVote(m.claims(marketId)[_claimId].expiration);
        _vote(alice, true, true); // alice votes yea
        _vote(bob, false, false); // bob votes nay
        _endVote(m.claims(marketId)[_claimId].vote.expiration);

        assertEq(uint8(m.claims(marketId)[_claimId - 1].status), uint8(IMarkets.ClaimStatus.PendingResolution), "testResolveFirstDispute: E0");

        _resolve(m.claims(marketId)[_claimId].vote.disputeExpiration);

        assertEq(uint8(m.claims(marketId)[_claimId - 1].status), uint8(IMarkets.ClaimStatus.PendingCommitteeResolution), "testResolveFirstDispute: E1");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingCommitteeResolution), "testResolveFirstDispute: E2");
    }

    // ==============================================================
    // CommitteeResolve // @todo - here
    // ==============================================================

    // ==============================================================
    // ClaimProceedsMulti
    // ==============================================================

    // ==============================================================
    // Internal helpers
    // ==============================================================

    function _getToFirstDisputePeriod(uint256 _amount) internal {
        _propose(_amount); // alice proposes a claim, and stakes for yea
        _stake(_amount, bob, false); // bob stakes for nay
        _stake(_amount, yossi, false); // yossi stakes for nay

        uint256 _claimId = m.claimsLength(marketId) - 1;
        _prepareVote(m.claims(marketId)[_claimId].expiration);

        _vote(alice, true, true); // alice votes yea
        _vote(bob, false, false); // bob votes nay

        _endVote(m.claims(marketId)[_claimId].vote.expiration);
    }
}