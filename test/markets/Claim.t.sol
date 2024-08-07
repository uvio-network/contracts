// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Base.sol";

contract MarketsTest is Base {

    uint256 public marketId = 1;

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Setup
    // ==============================================================

    function testSetup() public view {
        assertEq(m.minStake(), MIN_STAKE, "testSetup: E0");
        assertEq(m.minStakeIncrease(), MIN_STAKE_INCREASE, "testSetup: E1");
        assertEq(m.fee(), FEE, "testSetup: E2");
        assertEq(m.proposerFee(), 0, "testSetup: E3");
        assertEq(m.minClaimDuration(), MIN_CLAIM_DURATION, "testSetup: E4");
        assertEq(m.votingDuration(), VOTING_DURATION, "testSetup: E5");
        assertEq(m.disputeDuration(), DISPUTE_DURATION, "testSetup: E6");
        assertEq(address(m.asset()), address(asset), "testSetup: E7");
        assertEq(m.randomizer(), address(randomizer), "testSetup: E8");
        assertEq(address(m.priceProvider()), address(priceProvider), "testSetup: E9");
        assertEq(m.isWhitelistActive(), true, "testSetup: E10");
        assertEq(m.marketId(), 1, "testSetup: E11");
        assertEq(m.owner(), deployer, "testSetup: E12");
    }

    // ==============================================================
    // Propose
    // ==============================================================

    function testProposeYea(uint256 _amount) public {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        _deposit(alice, _amount);

        uint256 _claimId = m.claimsLength(marketId);
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(m));

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _amount,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            true, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        m.propose(_propose);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore - _amount, "testProposeYea: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore + _amount, "testProposeYea: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testProposeYea: E2");
        assertEq(m.claimsLength(marketId), _claimId + 1, "testProposeYea: E3");
        assertEq(m.nullifiedMarkets(marketId), 0, "testProposeYea: E4");
        assertEq(m.marketMinStake(marketId), MIN_STAKE, "testProposeYea: E5");
        assertEq(m.claims(marketId)[0].metadataURI, "metadataURI", "testProposeYea: E6");
        assertEq(m.claims(marketId)[0].expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeYea: E7");
        assertEq(m.claims(marketId)[0].proposer, alice, "testProposeYea: E8");
        assertEq(m.claims(marketId)[0].isNullifyMarket, false, "testProposeYea: E9");
        assertEq(m.claims(marketId)[0].stake.yea, _amount, "testProposeYea: E10");
        assertEq(m.claims(marketId)[0].stake.nay, 0, "testProposeYea: E11");
        assertEq(m.claims(marketId)[0].stake.expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeYea: E12");
        assertEq(m.claims(marketId)[0].stake.start, uint40(block.timestamp), "testProposeYea: E13");
        assertEq(m.claims(marketId)[0].stake.price.steepness, HALVES, "testProposeYea: E14");
        assertEq(m.claims(marketId)[0].stake.price.curveType, 0, "testProposeYea: E15");
        assertEq(m.claims(marketId)[0].vote.yea, 0, "testProposeYea: E16");
        assertEq(m.claims(marketId)[0].vote.nay, 0, "testProposeYea: E17");
        assertEq(m.claims(marketId)[0].vote.disputeExpiration, 0, "testProposeYea: E18");
        assertEq(m.claims(marketId)[0].vote.yeaVoters.length, 0, "testProposeYea: E19");
        assertEq(m.claims(marketId)[0].vote.nayVoters.length, 0, "testProposeYea: E20");
        assertEq(uint8(m.claims(marketId)[0].vote.outcome), uint8(IMarkets.Outcome.None), "testProposeYea: E21");
        assertEq(uint8(m.claims(marketId)[0].status), uint8(IMarkets.ClaimStatus.Active), "testProposeYea: E22");
        assertEq(m.claims(marketId)[0].stake.yeaStakers[0], alice, "testProposeYea: E23");
        assertEq(m.claims(marketId)[0].stake.yeaStakers.length, 1, "testProposeYea: E24");
        assertEq(m.claims(marketId)[0].stake.nayStakers.length, 0, "testProposeYea: E25");
    }

    function testProposeNay(uint256 _amount) public {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        _deposit(alice, _amount);

        uint256 _claimId = m.claimsLength(marketId);
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(m));

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            _amount,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        m.propose(_propose);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore - _amount, "testProposeNay: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore + _amount, "testProposeNay: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testProposeNay: E2");
        assertEq(m.claimsLength(marketId), _claimId + 1, "testProposeNay: E3");
        assertEq(m.nullifiedMarkets(marketId), 0, "testProposeNay: E4");
        assertEq(m.marketMinStake(marketId), MIN_STAKE, "testProposeNay: E5");
        assertEq(m.claims(marketId)[0].metadataURI, "metadataURI", "testProposeNay: E6");
        assertEq(m.claims(marketId)[0].expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeNay: E7");
        assertEq(m.claims(marketId)[0].proposer, alice, "testProposeNay: E8");
        assertEq(m.claims(marketId)[0].isNullifyMarket, false, "testProposeNay: E9");
        assertEq(m.claims(marketId)[0].stake.yea, 0, "testProposeNay: E10");
        assertEq(m.claims(marketId)[0].stake.nay, _amount, "testProposeNay: E11");
        assertEq(m.claims(marketId)[0].stake.expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeNay: E12");
        assertEq(m.claims(marketId)[0].stake.start, uint40(block.timestamp), "testProposeNay: E13");
        assertEq(m.claims(marketId)[0].stake.price.steepness, HALVES, "testProposeNay: E14");
        assertEq(m.claims(marketId)[0].stake.price.curveType, 0, "testProposeNay: E15");
        assertEq(m.claims(marketId)[0].vote.yea, 0, "testProposeNay: E16");
        assertEq(m.claims(marketId)[0].vote.nay, 0, "testProposeNay: E17");
        assertEq(m.claims(marketId)[0].vote.disputeExpiration, 0, "testProposeNay: E18");
        assertEq(m.claims(marketId)[0].vote.yeaVoters.length, 0, "testProposeNay: E19");
        assertEq(m.claims(marketId)[0].vote.nayVoters.length, 0, "testProposeNay: E20");
        assertEq(uint8(m.claims(marketId)[0].vote.outcome), uint8(IMarkets.Outcome.None), "testProposeNay: E21");
        assertEq(uint8(m.claims(marketId)[0].status), uint8(IMarkets.ClaimStatus.Active), "testProposeNay: E22");
        assertEq(m.claims(marketId)[0].stake.nayStakers[0], alice, "testProposeNay: E23");
        assertEq(m.claims(marketId)[0].stake.nayStakers.length, 1, "testProposeNay: E24");
        assertEq(m.claims(marketId)[0].stake.yeaStakers.length, 0, "testProposeNay: E25");
    }

    function testProposeInvalidPriceParamsInvalidCurveType(uint8 _invalidCurveType) public {
        vm.assume(_invalidCurveType != 0);

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(_invalidCurveType, HALVES)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidPriceParams.selector);
        m.propose(_propose);
    }

    function testProposeInvalidPriceParamsInvalidSteepness(uint8 _invalidSteepness) public {
        vm.assume(_invalidSteepness > priceProvider.MAX_HALVES());

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(_invalidSteepness, HALVES)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidPriceParams.selector);
        m.propose(_propose);
    }
 
    function testProposeInvalidClaimExpiration(uint40 _invalidClaimExpiration) public {
        vm.assume(_invalidClaimExpiration < block.timestamp + m.MIN_CLAIM_DURATION());

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            _invalidClaimExpiration, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidExpiration.selector);
        m.propose(_propose);
    }

    function testProposeInvalidStakeExpiration(uint40 _claimExpiration, uint40 _invalidStakeExpiration) public {
        vm.assume(
            _claimExpiration < (52 weeks * 100) &&
            _invalidStakeExpiration < _claimExpiration + m.MIN_STAKE_FREEZE_DURATION()
        );

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            _claimExpiration, // claimExpiration
            _invalidStakeExpiration, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidExpiration.selector);
        m.propose(_propose);
    }

    function testProposeInvalidNullifyMarketId(uint256 _invalidNullifyMarketId) public {
        vm.assume(_invalidNullifyMarketId != 0);

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            _invalidNullifyMarketId, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidNullifyMarketId.selector);
        m.propose(_propose);
    }

    function testProposeNotWhitelistedUser() public {
        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );
        vm.prank(notWhitelistedUser);
        vm.expectRevert(IMarkets.NotWhitelisted.selector);
        m.propose(_propose);
    }

    function testProposeNoDeposit() public {
        vm.prank(deployer);
        m.whitelistUser(notWhitelistedUser);

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration
            false, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );
        vm.prank(notWhitelistedUser);
        vm.expectRevert(); // arithmetic underflow or overflow
        m.propose(_propose);
    }

    // ==============================================================
    // Stake
    // ==============================================================

    function testStakeYea(uint256 _amount) public {
        testProposeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);
        uint256 _bobBalanceBefore = m.userBalance(bob);
        uint256 _bobStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(m));
        vm.prank(bob);
        m.stake(marketId, _amount, true);

        assertEq(m.userBalance(bob), _bobBalanceBefore - _amount, "testStakeYea: E0");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeYea: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testStakeYea: E2");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStakeYea: E3");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers.length, 2, "testStakeYea: E4");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeYea: E5");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[1], bob, "testStakeYea: E5");
        assertEq(uint8(m.userStakeStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Yea), "testStakeYea: E6");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeYea: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = m.userBalance(yossi);
        uint256 _yossiStakeBefore = m.userStake(yossi, m.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(m));
        vm.prank(yossi);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeYea: E8");
        assertEq(m.userStake(yossi, m.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeYea: E9");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testStakeYea: E10");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _amount, "testStakeYea: E11");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeYea: E12");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], yossi, "testStakeYea: E13");
        assertEq(uint8(m.userStakeStatus(yossi, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testStakeYea: E14");
        assertEq(uint8(m.userVoteStatus(yossi, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeYea: E15");
    }

    function testStakeNay(uint256 _amount) public {
        testProposeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);
        uint256 _bobBalanceBefore = m.userBalance(bob);
        uint256 _bobStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(m));
        vm.prank(bob);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(bob), _bobBalanceBefore - _amount, "testStakeNay: E0");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeNay: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testStakeNay: E2");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _amount, "testStakeNay: E3");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeNay: E4");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E5");
        assertEq(uint8(m.userStakeStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testStakeNay: E6");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeNay: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = m.userBalance(yossi);
        uint256 _yossiStakeBefore = m.userStake(yossi, m.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(m));
        vm.prank(yossi);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeNay: E8");
        assertEq(m.userStake(yossi, m.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeNay: E9");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testStakeNay: E10");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _amount * 2, "testStakeNay: E11");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 2, "testStakeNay: E12");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E13");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[1], yossi, "testStakeNay: E14");
        assertEq(uint8(m.userStakeStatus(yossi, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testStakeNay: E15");
        assertEq(uint8(m.userVoteStatus(yossi, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeNay: E16");
    }

    function testStakeTie(uint256 _amount) public {
        testProposeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);
        uint256 _bobBalanceBefore = m.userBalance(bob);
        uint256 _bobStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(m));
        vm.prank(bob);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTie: E0");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTie: E1");
        assertEq(IERC20(asset).balanceOf(address(m)), _storageBalanceBefore, "testStakeTie: E2");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _amount, "testStakeTie: E3");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testStakeTie: E4");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeTie: E5");
        assertEq(uint8(m.userStakeStatus(alice, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Yea), "testStakeTie: E6");
        assertEq(uint8(m.userVoteStatus(alice, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeTie: E7");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _amount, "testStakeTie: E8");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTie: E9");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTie: E10");
        assertEq(uint8(m.userStakeStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testStakeTie: E11");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.None), "testStakeTie: E12");
    }

    function testStakeExponentialDecay(uint256 _amount) public {
        testProposeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        IMarkets.Stake memory _stake = m.claims(marketId)[_claimId].stake;
        uint256 _halvingTime = (_stake.expiration - _stake.start) / _stake.price.steepness;

        _deposit(bob, _amount);
        skip(_halvingTime);
        uint256 _bobBalanceBefore = m.userBalance(bob);
        vm.prank(bob);
        uint256 _bobWeightedStake = m.stake(marketId, _amount, false);

        _deposit(yossi, _amount);
        skip(_halvingTime);
        uint256 _yossiBalanceBefore = m.userBalance(yossi);
        vm.prank(yossi);
        uint256 _yossiWeightedStake = m.stake(marketId, _amount, true);

        assertEq(_bobWeightedStake, m.userStake(bob, m.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E0");
        assertEq(_yossiWeightedStake, m.userStake(yossi, m.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E1");
        assertEq(_bobWeightedStake, m.userStake(alice, m.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E2");
        assertEq(_yossiWeightedStake, m.userStake(bob, m.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E3");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yossiWeightedStake + m.userStake(alice, m.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E4");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _bobWeightedStake, "testStakeExponentialDecay: E5");
        assertEq(_bobBalanceBefore - _amount, m.userBalance(bob), "testStakeExponentialDecay: E6");
        assertEq(_yossiBalanceBefore - _amount, m.userBalance(yossi), "testStakeExponentialDecay: E7");
    }

    function testStakeAfterPropose(uint256 _amount) public {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        testProposeYea(_amount);

        _deposit(alice, _amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);

        vm.prank(alice);
        m.stake(marketId, _amount, true);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore - _amount, "testStakeAfterPropose: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore + _amount, "testStakeAfterPropose: E1");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStakeAfterPropose: E2");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testStakeAfterPropose: E3");
        assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeAfterPropose: E4");
        assertEq(uint8(m.userStakeStatus(alice, _claimKey)), uint8(IMarkets.VoteStatus.Yea), "testStakeAfterPropose: E5");

        vm.prank(alice);
        vm.expectRevert(IMarkets.InvalidStake.selector);
        m.stake(marketId, _amount, false);
    }

    function testStakeTwice(uint256 _amount) public {
        testProposeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount * 2);

        uint256 _bobBalanceBefore = m.userBalance(bob);
        uint256 _bobStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));

        vm.prank(bob);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E0");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E1");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E2");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E3");

        _bobBalanceBefore = m.userBalance(bob);
        _bobStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));

        vm.prank(bob);
        m.stake(marketId, _amount, false);

        assertEq(m.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E3");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E4");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E5");
        assertEq(m.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E6");
    }

    function testStakeWithDifferentExpirationThanClaim(uint40 _difference) public {
        vm.assume(_difference < 52 weeks * 100);

        IMarkets.Propose memory _propose = IMarkets.Propose(
            "metadataURI",
            marketId,
            0, // nullifyMarketId
            1 ether,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration
            uint40(block.timestamp) + MIN_CLAIM_DURATION + _difference, // stakingExpiration
            true, // yea
            false, // dispute
            IMarkets.Price(0, HALVES)
        );

        vm.prank(alice);
        m.propose(_propose);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        _deposit(bob, MIN_STAKE);
        vm.prank(bob);
        vm.expectRevert(IMarkets.InvalidExpiration.selector);
        m.stake(marketId, MIN_STAKE, true);

        skip(_difference);

        vm.prank(bob);
        m.stake(marketId, MIN_STAKE, true);
    }

    function testStakeInvalidAmount(uint256 _invalidAmount) public {
        testProposeYea(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_invalidAmount < _getMarketMinStake(_claimId));

        vm.prank(bob);
        vm.expectRevert(IMarkets.InvalidAmount.selector);
        m.stake(marketId, _invalidAmount, true);
    }

    function testStakeNotStakingPeriod() public {
        testProposeYea(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].stake.expiration;
        skip(_expiration - block.timestamp + 1);

        vm.prank(bob);
        vm.expectRevert(IMarkets.NotStakingPeriod.selector);
        m.stake(marketId, MIN_STAKE, true);
    }

    function testStakeWrongMarketId(uint256 _wrongMarketId) public {
        vm.assume(_wrongMarketId != marketId);

        testProposeYea(MIN_STAKE);

        marketId = _wrongMarketId;

        vm.prank(bob);
        vm.expectRevert();
        m.stake(marketId, MIN_STAKE, true);
    }

    function testStakeInvalidStake() public {
        testProposeYea(MIN_STAKE);

        _deposit(bob, MIN_STAKE);
        vm.prank(bob);
        m.stake(marketId, MIN_STAKE, true);

        vm.prank(bob);
        vm.expectRevert(IMarkets.InvalidStake.selector);
        m.stake(marketId, MIN_STAKE, false);

        _deposit(yossi, MIN_STAKE);
        vm.prank(yossi);
        m.stake(marketId, MIN_STAKE, false);

        vm.prank(yossi);
        vm.expectRevert(IMarkets.InvalidStake.selector);
        m.stake(marketId, MIN_STAKE, true);
    }

    function testStakeNotWhitelisted() public {
        testProposeYea(MIN_STAKE);

        vm.prank(notWhitelistedUser);
        vm.expectRevert(IMarkets.NotWhitelisted.selector);
        m.stake(marketId, MIN_STAKE, true);
    }

    function testStakeNoDeposit() public {
        testProposeYea(MIN_STAKE);

        vm.prank(deployer);
        m.whitelistUser(notWhitelistedUser);

        vm.prank(notWhitelistedUser);
        vm.expectRevert(); // arithmetic underflow or overflow
        m.stake(marketId, MIN_STAKE, true);
    }

    // ==============================================================
    // PrepareVote
    // ==============================================================

    function testPrepareVoteYea(uint256 _amount) public {
        testStakeYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = yossi;
        randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);

        assertEq(m.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteYea: E0");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteYea: E1");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteYea: E2");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteYea: E3");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters[0], yossi, "testPrepareVoteYea: E4");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingVote), "testPrepareVoteYea: E5");
    }

    function testPrepareVoteNay(uint256 _amount) public {
        testStakeNay(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = yossi;
        randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);

        assertEq(m.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteNay: E0");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteNay: E1");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteNay: E2");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteNay: E3");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters[0], yossi, "testPrepareVoteNay: E4");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingVote), "testPrepareVoteNay: E5");
    }

    function testPrepareVoteTie(uint256 _amount) public {
        testStakeTie(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = bob;
        randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);

        assertEq(m.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteTie: E0");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteTie: E1");
        assertEq(m.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteTie: E2");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteTie: E3");
        assertEq(m.claims(marketId)[_claimId].vote.nayVoters[0], bob, "testPrepareVoteTie: E4");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingVote), "testPrepareVoteTie: E5");
    }

    function testPrepareVoteOnlyRandomizer() public {
        testProposeYea(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = yossi;
        vm.prank(bob);
        vm.expectRevert(IMarkets.OnlyRandomizer.selector);
        m.prepareVote(_yeaVoters, _nayVoters, marketId);
    }

    function testPrepareVoteClaimNotExpired() public {
        testProposeYea(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp - 1);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = yossi;
        vm.prank(address(randomizer));
        vm.expectRevert(IMarkets.ClaimNotExpired.selector);
        m.prepareVote(_yeaVoters, _nayVoters, marketId);
    }

    function testPrepareVoteClaimNotActive() public {
        testProposeYea(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].expiration;
        skip(_expiration - block.timestamp);

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = alice;
        address[] memory _nayVoters = new address[](1);
        _nayVoters[0] = yossi;
        vm.prank(address(randomizer));
        m.prepareVote(_yeaVoters, _nayVoters, marketId);

        vm.prank(address(randomizer));
        vm.expectRevert(IMarkets.ClaimNotActive.selector);
        m.prepareVote(_yeaVoters, _nayVoters, marketId);
    }

    // ==============================================================
    // Vote
    // ==============================================================

    // bob votes against his stake
    function testVoteYea(uint256 _amount) public {
        testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _yeaStakeBefore = m.claims(marketId)[_claimId].stake.yea;
        uint256 _nayStakeBefore = m.claims(marketId)[_claimId].stake.nay;

        vm.prank(alice);
        m.vote(marketId, true, true);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 1, "testVoteYea: E0");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 0, "testVoteYea: E1");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteYea: E2");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteYea: E3");
        assertEq(uint8(m.userVoteStatus(alice, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Yea), "testVoteYea: E4");

        vm.prank(bob);
        m.vote(marketId, true, false);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 2, "testVoteYea: E5");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 0, "testVoteYea: E6");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore + _amount, "testVoteYea: E7");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore - _amount, "testVoteYea: E8");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Yea), "testVoteYea: E9");
    }

    // alice votes against her stake
    function testVoteNay(uint256 _amount) public {
        testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _yeaStakeBefore = m.claims(marketId)[_claimId].stake.yea;
        uint256 _nayStakeBefore = m.claims(marketId)[_claimId].stake.nay;

        vm.prank(alice);
        m.vote(marketId, false, true);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 0, "testVoteNay: E0");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 1, "testVoteNay: E1");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore - _amount, "testVoteNay: E2");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore + _amount, "testVoteNay: E3");
        assertEq(uint8(m.userVoteStatus(alice, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testVoteNay: E4");

        vm.prank(bob);
        m.vote(marketId, false, false);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 0, "testVoteNay: E5");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 2, "testVoteNay: E6");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore - _amount, "testVoteNay: E7");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore + _amount, "testVoteNay: E8");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testVoteNay: E9");
    }

    // everyone votes for their stake
    function testVoteTie(uint256 _amount) public {
        testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        uint256 _yeaStakeBefore = m.claims(marketId)[_claimId].stake.yea;
        uint256 _nayStakeBefore = m.claims(marketId)[_claimId].stake.nay;

        vm.prank(alice);
        m.vote(marketId, true, true);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 1, "testVoteTie: E0");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 0, "testVoteTie: E1");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteTie: E2");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteTie: E3");
        assertEq(uint8(m.userVoteStatus(alice, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Yea), "testVoteTie: E4");

        vm.prank(bob);
        m.vote(marketId, false, false);

        assertEq(m.claims(marketId)[_claimId].vote.yea, 1, "testVoteTie: E5");
        assertEq(m.claims(marketId)[_claimId].vote.nay, 1, "testVoteTie: E6");
        assertEq(m.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteTie: E7");
        assertEq(m.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteTie: E8");
        assertEq(uint8(m.userVoteStatus(bob, m.claimKey(marketId, _claimId))), uint8(IMarkets.VoteStatus.Nay), "testVoteTie: E9");
    }

    function testVoteNotVotingPeriod() public {
        testPrepareVoteTie(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
        skip(_expiration - block.timestamp + 1);

        vm.prank(bob);
        vm.expectRevert(IMarkets.NotVotingPeriod.selector);
        m.vote(marketId, true, true);
    }

    function testVoteWrongMarketId(uint256 _wrongMarketId) public {
        vm.assume(_wrongMarketId != marketId);

        testPrepareVoteTie(MIN_STAKE);

        marketId = _wrongMarketId;

        vm.prank(bob);
        vm.expectRevert();
        m.vote(marketId, true, true);
    }

    function testVoteNotVoter() public {
        testPrepareVoteNay(MIN_STAKE);

        vm.prank(yossi);
        vm.expectRevert(IMarkets.NotVoter.selector);
        m.vote(marketId, true, true);
    }

    function testVoteAlreadyVoted() public {
        testPrepareVoteNay(MIN_STAKE);

        vm.prank(alice);
        m.vote(marketId, true, true);

        vm.prank(alice);
        vm.expectRevert(IMarkets.AlreadyVoted.selector);
        m.vote(marketId, true, true);
    }

    // ==============================================================
    // EndVote
    // ==============================================================

    function testEndVoteYea(uint256 _amount) public {
        testVoteYea(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
        skip(_expiration - block.timestamp);

        m.endVote(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].vote.outcome), uint8(IMarkets.Outcome.Yea), "testEndVoteYea: E0");
        assertEq(m.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteYea: E1");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingResolution), "testEndVoteYea: E2");
    }

    function testEndVoteNay(uint256 _amount) public {
        testVoteNay(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
        skip(_expiration - block.timestamp);

        m.endVote(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].vote.outcome), uint8(IMarkets.Outcome.Nay), "testEndVoteNay: E0");
        assertEq(m.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteNay: E1");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingResolution), "testEndVoteNay: E2");
    }

    function testEndVoteTie(uint256 _amount) public {
        testVoteTie(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
        skip(_expiration - block.timestamp);

        m.endVote(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].vote.outcome), uint8(IMarkets.Outcome.Tie), "testEndVoteTie: E0");
        assertEq(m.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteTie: E1");
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingResolution), "testEndVoteTie: E2");
    }

    function testEndVoteNotPendingVote() public {
        testProposeYea(MIN_STAKE);

        vm.prank(bob);
        vm.expectRevert(IMarkets.NotPendingVote.selector);
        m.endVote(marketId);
    }

    function testEndVoteVotePeriodNotExpired() public {
        testPrepareVoteTie(MIN_STAKE);

        vm.prank(bob);
        vm.expectRevert(IMarkets.VotePeriodNotExpired.selector);
        m.endVote(marketId);
    }

    function testEndVoteWrongMarketId(uint256 _wrongMarketId) public {
        vm.assume(_wrongMarketId != marketId);

        testPrepareVoteTie(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
        skip(_expiration - block.timestamp);

        marketId = _wrongMarketId;

        vm.prank(bob);
        vm.expectRevert();
        m.endVote(marketId);
    }

    // ==============================================================
    // Resolve
    // ==============================================================

    function testResolveYea(uint256 _amount) public {
        testEndVoteYea(_amount); // alice staked yea, bob staked nay. bob votes against his stake

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.disputeExpiration;
        skip(_expiration - block.timestamp);

        m.resolve(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedYea), "testResolveYea: E0");
    }

    function testResolveNay(uint256 _amount) public {
        testEndVoteNay(_amount); // alice staked yea, bob staked nay. alice votes against her stake

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.disputeExpiration;
        skip(_expiration - block.timestamp);

        m.resolve(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedNay), "testResolveNay: E0");
    }

    function testResolveTie(uint256 _amount) public {
        testEndVoteTie(_amount); // alice staked yea, bob staked nay. both vote for their stake

        uint256 _claimId = m.claimsLength(marketId) - 1;
        uint256 _expiration = m.claims(marketId)[_claimId].vote.disputeExpiration;
        skip(_expiration - block.timestamp);

        m.resolve(marketId);

        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.PendingCommitteeResolution), "testResolveTie: E0");
    }

    function testResolveDisputePeriodNotExpired() public {
        testEndVoteTie(MIN_STAKE);

        vm.prank(bob);
        vm.expectRevert(IMarkets.DisputePeriodNotExpired.selector);
        m.resolve(marketId);
    }

    function testResolveNotPendingResolution() public {
        testProposeYea(MIN_STAKE);

        vm.prank(bob);
        vm.expectRevert(IMarkets.NotPendingResolution.selector);
        m.resolve(marketId);
    }

    // ==============================================================
    // CommitteeResolve
    // ==============================================================

    function testCommitteeResolveYea(uint256 _amount) public {
        testResolveTie(_amount);

        vm.prank(deployer);
        m.committeeResolve(IMarkets.Outcome.Yea, marketId);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedYea), "testCommitteeResolveYea: E0");
    }

    function testCommitteeResolveNay(uint256 _amount) public {
        testResolveTie(_amount);

        vm.prank(deployer);
        m.committeeResolve(IMarkets.Outcome.Nay, marketId);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedNay), "testCommitteeResolveNay: E0");
    }

    function testCommitteeResolveNullified(uint256 _amount) public {
        testResolveTie(_amount);

        vm.prank(deployer);
        m.committeeResolve(IMarkets.Outcome.Tie, marketId);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.Nullified), "testCommitteeResolveNullified: E0");
    }

    function testCommitteeResolveNotPendingCommitteeResolution() public {
        testProposeYea(MIN_STAKE);

        vm.prank(deployer);
        vm.expectRevert(IMarkets.NotPendingCommitteeResolution.selector);
        m.committeeResolve(IMarkets.Outcome.Yea, marketId);
    }

    function testCommitteeResolveNotOwner() public {
        testResolveTie(MIN_STAKE);

        vm.prank(bob);
        vm.expectRevert();
        m.committeeResolve(IMarkets.Outcome.Yea, marketId);
    }

    function testCommitteeResolveWrongMarketId(uint256 _wrongMarketId) public {
        vm.assume(_wrongMarketId != marketId);

        testResolveTie(MIN_STAKE);

        marketId = _wrongMarketId;

        vm.prank(deployer);
        vm.expectRevert();
        m.committeeResolve(IMarkets.Outcome.Yea, marketId);
    }

    // ==============================================================
    // ClaimProceeds
    // ==============================================================

    function testClaimProceedsYea(uint256 _amount, bool _isMulti) public {
        testCommitteeResolveYea(_amount); // alice staked yea, bob staked nay. both vote for their stake. committee resolves to yea
        //                                   so bob's stake is distributed to alice

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _expectedFee = _amount * m.fee() / m.PRECISION();

        if (_isMulti) {
            uint256[] memory _claimIds = new uint256[](1);
            _claimIds[0] = _claimId;
            m.claimProceedsMulti(_claimIds, marketId, alice);
        } else {
            m.claimProceeds(marketId, _claimId, alice);
        }

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore + _amount + (_amount - _expectedFee), "testClaimProceedsYea: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore, "testClaimProceedsYea: E1");
        assertEq(m.userBalance(m.owner()), _expectedFee, "testClaimProceedsYea: E2");
        assertTrue(m.userClaimed(alice, _claimKey), "testClaimProceedsYea: E3");

        vm.expectRevert(IMarkets.InvalidClaimStatus.selector);
        m.claimProceeds(marketId, _claimId, bob);
    }

    function testClaimProceedsNay(uint256 _amount, bool _isMulti) public {
        testCommitteeResolveNay(_amount); // alice staked yea, bob staked nay. both vote for their stake. committee resolves to nay
        //                                   so alice's stake is distributed to bob

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(bob);
        uint256 _userStakeBefore = m.userStake(bob, _claimKey);
        uint256 _expectedFee = _amount * m.fee() / m.PRECISION();

        if (_isMulti) {
            uint256[] memory _claimIds = new uint256[](1);
            _claimIds[0] = _claimId;
            m.claimProceedsMulti(_claimIds, marketId, bob);
        } else {
            m.claimProceeds(marketId, _claimId, bob);
        }

        assertEq(m.userBalance(bob), _userBalanceBalanceBefore + _amount + (_amount - _expectedFee), "testClaimProceedsNay: E0");
        assertEq(m.userStake(bob, _claimKey), _userStakeBefore, "testClaimProceedsNay: E1");
        assertEq(m.userBalance(m.owner()), _expectedFee, "testClaimProceedsNay: E2");
        assertTrue(m.userClaimed(bob, _claimKey), "testClaimProceedsNay: E3");

        vm.expectRevert(IMarkets.InvalidClaimStatus.selector);
        m.claimProceeds(marketId, _claimId, alice);
    }

    function testClaimProceedsNullified(uint256 _amount) public {
        testCommitteeResolveNullified(_amount); // alice staked yea, bob staked nay. both vote for their stake. committee resolves to nullified
        //                                        so both alice's and bob's get their stake back minus the fee

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _expectedFee = _amount * m.fee() / m.PRECISION();

        m.claimProceeds(marketId, _claimId, alice);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore + _amount - _expectedFee, "testClaimProceedsNullified: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore, "testClaimProceedsNullified: E1");
        assertEq(m.userBalance(m.owner()), _expectedFee, "testClaimProceedsNullified: E2");
        assertTrue(m.userClaimed(alice, _claimKey), "testClaimProceedsNullified: E3");

        _userBalanceBalanceBefore = m.userBalance(bob);
        _userStakeBefore = m.userStake(bob, _claimKey);

        m.claimProceeds(marketId, _claimId, bob);

        assertEq(m.userBalance(bob), _userBalanceBalanceBefore + _amount - _expectedFee, "testClaimProceedsNullified: E4");
        assertEq(m.userStake(bob, _claimKey), _userStakeBefore, "testClaimProceedsNullified: E5");
        assertEq(m.userBalance(m.owner()), 2 * _expectedFee, "testClaimProceedsNullified: E6");
        assertTrue(m.userClaimed(bob, _claimKey), "testClaimProceedsNullified: E7");
    }

    function testClaimProceedsYeaNoEarnings(uint256 _amount) public {
        testResolveYea(_amount); // alice staked yea, bob staked nay. bob votes against his stake. therefore no earnings

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);

        m.claimProceeds(marketId, _claimId, alice);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore + _amount, "testClaimProceedsYea: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore, "testClaimProceedsYea: E1");
        assertEq(m.userBalance(m.owner()), 0, "testClaimProceedsYea: E2");
        assertTrue(m.userClaimed(alice, _claimKey), "testClaimProceedsYea: E3");

        _userBalanceBalanceBefore = m.userBalance(bob);
        _userStakeBefore = m.userStake(bob, _claimKey);

        m.claimProceeds(marketId, _claimId, bob);

        assertEq(m.userBalance(bob), _userBalanceBalanceBefore + _amount, "testClaimProceedsYea: E4");
        assertEq(m.userStake(bob, _claimKey), _userStakeBefore, "testClaimProceedsYea: E5");
        assertEq(m.userBalance(m.owner()), 0, "testClaimProceedsYea: E6");
        assertTrue(m.userClaimed(bob, _claimKey), "testClaimProceedsYea: E7");
    }

    function testClaimProceedsNayNoEarnings(uint256 _amount) public {
        testResolveNay(_amount); // alice staked yea, bob staked nay. alice votes against her stake. therefore no earnings

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);

        m.claimProceeds(marketId, _claimId, alice);

        assertEq(m.userBalance(alice), _userBalanceBalanceBefore + _amount, "testClaimProceedsNay: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore, "testClaimProceedsNay: E1");
        assertEq(m.userBalance(m.owner()), 0, "testClaimProceedsNay: E2");
        assertTrue(m.userClaimed(alice, _claimKey), "testClaimProceedsNay: E3");

        _userBalanceBalanceBefore = m.userBalance(bob);
        _userStakeBefore = m.userStake(bob, _claimKey);

        m.claimProceeds(marketId, _claimId, bob);

        assertEq(m.userBalance(bob), _userBalanceBalanceBefore + _amount, "testClaimProceedsNay: E4");
        assertEq(m.userStake(bob, _claimKey), _userStakeBefore, "testClaimProceedsNay: E5");
        assertEq(m.userBalance(m.owner()), 0, "testClaimProceedsNay: E6");
        assertTrue(m.userClaimed(bob, _claimKey), "testClaimProceedsNay: E7");
    }

    function testClaimProceedsNoVoteStatus(uint256 _amount) public {
        testStakeYea(_amount); // alice and bob stake yea. yossi stakes nay

        uint256 _claimId = m.claimsLength(marketId) - 1;

        // prepareVote
        {
            uint256 _expiration = m.claims(marketId)[_claimId].expiration;
            skip(_expiration - block.timestamp);
            address[] memory _yeaVoters = new address[](1);
            _yeaVoters[0] = alice;
            address[] memory _nayVoters = new address[](1);
            _nayVoters[0] = bob;
            randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);
        }

        // vote -- only alice votes. bob and yossi don't vote
        {
            vm.prank(alice);
            m.vote(marketId, true, true); // alice votes for her stake
        }

        // endVote
        {
            uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
            skip(_expiration - block.timestamp);
            m.endVote(marketId);
        }

        // resolve
        {
            uint256 _expiration = m.claims(marketId)[_claimId].vote.disputeExpiration;
            skip(_expiration - block.timestamp);
            m.resolve(marketId);
            assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedYea), "testClaimProceedsNoVoteStatus: E0");
        }

        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, m.claimKey(marketId, _claimId));
        uint256 _expectedFee = _amount * m.fee() / m.PRECISION();

        m.claimProceeds(marketId, _claimId, alice);

        assertApproxEqAbs(m.userBalance(alice), _userBalanceBalanceBefore + _amount + ((_amount - _expectedFee) / 2), 1, "testClaimProceedsNoVoteStatus: E1");
        assertEq(m.userStake(alice, m.claimKey(marketId, _claimId)), _userStakeBefore, "testClaimProceedsNoVoteStatus: E2");
        assertEq(m.userBalance(m.owner()), _expectedFee / 2, "testClaimProceedsNoVoteStatus: E3");
        assertTrue(m.userClaimed(alice, m.claimKey(marketId, _claimId)), "testClaimProceedsNoVoteStatus: E4");

        _userBalanceBalanceBefore = m.userBalance(bob);
        _userStakeBefore = m.userStake(bob, m.claimKey(marketId, _claimId));

        m.claimProceeds(marketId, _claimId, bob);

        assertApproxEqAbs(m.userBalance(bob), _userBalanceBalanceBefore + _amount + ((_amount - _expectedFee) / 2), 1, "testClaimProceedsNoVoteStatus: E5");
        assertEq(m.userStake(bob, m.claimKey(marketId, _claimId)), _userStakeBefore, "testClaimProceedsNoVoteStatus: E6");
        assertApproxEqAbs(m.userBalance(m.owner()), _expectedFee, 1, "testClaimProceedsNoVoteStatus: E7");
        assertTrue(m.userClaimed(bob, m.claimKey(marketId, _claimId)), "testClaimProceedsNoVoteStatus: E8");

        vm.expectRevert(IMarkets.InvalidClaimStatus.selector);
        m.claimProceeds(marketId, _claimId, yossi);
    }

    function testClaimProceedsProposerFee(uint256 _amount) public {
        testCommitteeResolveNullified(_amount); // alice staked yea, bob staked nay. both vote for their stake. committee resolves to nullified
        //                                        so both alice's and bob's get their stake back minus the fee

        vm.prank(deployer);
        m.setProposerFee(5000); // 50%

        uint256 _claimId = m.claimsLength(marketId) - 1;
        bytes32 _claimKey = m.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = m.userBalance(alice);
        uint256 _userStakeBefore = m.userStake(alice, _claimKey);
        uint256 _expectedFee = _amount * m.fee() / m.PRECISION() / 2;

        m.claimProceeds(marketId, _claimId, alice);

        assertApproxEqAbs(m.userBalance(alice), _userBalanceBalanceBefore + _amount - _expectedFee, 1, "testClaimProceedsProposerFee: E0");
        assertEq(m.userStake(alice, _claimKey), _userStakeBefore, "testClaimProceedsProposerFee: E1");
        assertApproxEqAbs(m.userBalance(m.owner()), _expectedFee, 1, "testClaimProceedsProposerFee: E2");
        assertTrue(m.userClaimed(alice, _claimKey), "testClaimProceedsProposerFee: E3");

        _userBalanceBalanceBefore = m.userBalance(bob);
        _userStakeBefore = m.userStake(bob, _claimKey);

        m.claimProceeds(marketId, _claimId, bob);

        assertApproxEqAbs(m.userBalance(bob), _userBalanceBalanceBefore + _amount - (_expectedFee * 2), 1, "testClaimProceedsProposerFee: E4");
        assertEq(m.userStake(bob, _claimKey), _userStakeBefore, "testClaimProceedsProposerFee: E5");
        assertApproxEqAbs(m.userBalance(m.owner()), _expectedFee * 2, 2, "testClaimProceedsProposerFee: E6");
        assertApproxEqAbs(m.userBalance(alice), _userBalanceBalanceBefore + _amount, 1, "testClaimProceedsProposerFee: E7");
        assertTrue(m.userClaimed(bob, _claimKey), "testClaimProceedsProposerFee: E8");
    }

    function testClaimProceedsInvalidAddress() public {
        vm.expectRevert(IMarkets.InvalidAddress.selector);
        m.claimProceeds(marketId, 0, address(0));
    }

    function testClaimProceedsAlreadyClaimed(uint256 _amount) public {
        testCommitteeResolveNullified(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        m.claimProceeds(marketId, _claimId, alice);

        vm.expectRevert(IMarkets.AlreadyClaimed.selector);
        m.claimProceeds(marketId, _claimId, alice);
    }

    function testClaimProceedsNoStake(uint256 _amount) public {
        testCommitteeResolveNullified(_amount);

        uint256 _claimId = m.claimsLength(marketId) - 1;
        vm.expectRevert(IMarkets.NoStake.selector);
        m.claimProceeds(marketId, _claimId, yossi);
    }

    function testClaimProceedsWrongMarketId(uint256 _wrongMarketId) public {
        vm.assume(_wrongMarketId != marketId);

        testCommitteeResolveNullified(MIN_STAKE);

        uint256 _claimId = m.claimsLength(marketId) - 1;

        vm.expectRevert();
        m.claimProceeds(_wrongMarketId, _claimId, alice);
    }

    function testClaimProceedsWrongClaimId(uint256 _wrongClaimId) public {
        vm.assume(_wrongClaimId != 0);

        testCommitteeResolveNullified(MIN_STAKE);

        vm.expectRevert();
        m.claimProceeds(marketId, _wrongClaimId, alice);
    }
}