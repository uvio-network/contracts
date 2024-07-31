// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./Base.sol";

contract ClaimMarketTest is Base {

    uint256 public marketId = 0;

    function setUp() public override {
        Base.setUp();

        vm.prank(alice);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);
        vm.prank(bob);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);
        vm.prank(yossi);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);

        vm.startPrank(deployer);
        s.whitelistUser(alice);
        s.whitelistUser(bob);
        s.whitelistUser(yossi);
        vm.stopPrank();
    }

    // ==============================================================
    // Setup
    // ==============================================================

    function testSetup() public view {
        assertEq(claimMarket.maxClaims(), MAX_CLAIMS, "testSetup: E0");
        assertEq(claimMarket.globalMinStake(), MIN_STAKE, "testSetup: E1");
        assertEq(claimMarket.minClaimDuration(), MIN_CLAIM_DURATION, "testSetup: E2");
        assertEq(claimMarket.votersLimit(), VOTERS_LIMIT, "testSetup: E3");
        assertEq(claimMarket.votingDuration(), VOTING_DURATION, "testSetup: E4");
        assertEq(claimMarket.disputeDuration(), DISPUTE_DURATION, "testSetup: E5");
        assertEq(claimMarket.fee(), FEE, "testSetup: E6");
        assertEq(claimMarket.randomizer(), address(randomizer), "testSetup: E7");
        assertEq(address(claimMarket.s()), address(s), "testSetup: E8");
        assertEq(address(claimMarket.nullifyMarket()), address(nullifyMarket), "testSetup: E9");
        assertEq(claimMarket.owner(), deployer, "testSetup: E10");
        assertEq(claimMarket.minStakeIncrease(), MIN_STAKE_INCREASE, "testSetup: E11");
    }

    // ==============================================================
    // Propose
    // ==============================================================

    function testPropose(uint256 _amount) public {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        _deposit(alice, _amount);

        uint256 _claimId = s.claimsLength(marketId);
        bytes32 _claimKey = s.claimKey(marketId, _claimId);
        uint256 _userBalanceBalanceBefore = s.userBalance(alice);
        uint256 _userStakeBefore = s.userStake(alice, _claimKey);
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));

        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            _amount,
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        claimMarket.propose(_propose);

        assertEq(s.userBalance(alice), _userBalanceBalanceBefore - _amount, "testPropose: E0");
        assertEq(s.userStake(alice, _claimKey), _userStakeBefore + _amount, "testPropose: E1");
        assertTrue(claimMarket.isMarket(marketId), "testPropose: E2");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testPropose: E3");
        assertEq(claimMarket.marketMinStake(marketId), _getMarketMinStake(_claimId), "testPropose: E4");
        assertEq(s.claims(marketId)[_claimId].metadataURI, "metadataURI", "testPropose: E5");
        assertEq(s.claims(marketId)[_claimId].expiration, block.timestamp + MIN_CLAIM_DURATION, "testPropose: E6");
        assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(IStorage.ClaimStatus.Active), "testPropose: E7");
        assertEq(s.claims(marketId)[_claimId].stake.yea, _amount, "testPropose: E8");
        assertEq(s.claims(marketId)[_claimId].stake.nay, 0, "testPropose: E9");
        assertEq(s.claims(marketId)[_claimId].stake.expiration, block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), "testPropose: E10");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testPropose: E11");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testPropose: E12");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 0, "testPropose: E13");
        assertEq(s.claims(marketId)[_claimId].vote.yea, 0, "testPropose: E14");
        assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testPropose: E15");
        assertEq(s.claims(marketId)[_claimId].vote.expiration, 0, "testPropose: E16");
        assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, 0, "testPropose: E17");
        assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 0, "testPropose: E18");
        assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 0, "testPropose: E19");
        assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(IStorage.Outcome.None), "testPropose: E20");
        assertEq(s.claims(marketId)[_claimId].proposer, alice, "testPropose: E21");
        assertEq(s.claims(marketId)[_claimId].stake.start, block.timestamp, "testPropose: E22");
    }

    function testProposeInvalidMinStake(uint256 _invalidMinStake) public {
        vm.assume(_invalidMinStake < MIN_STAKE);

        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            0, // marketId
            0, // refMarketId
            0, // amount
            _invalidMinStake,
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidMinStake.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidAmount(uint256 _invalidAmount) public {
        vm.assume(_invalidAmount < MIN_STAKE);

        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            marketId,
            0, // refMarketId
            _invalidAmount,
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidAmount.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidClaimExpiration(uint256 _invalidClaimExpiration) public {
        vm.assume(_invalidClaimExpiration < block.timestamp + MIN_CLAIM_DURATION);

        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            _invalidClaimExpiration, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidExpiration.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidStakeExpiration(uint256 _claimExpiration, uint256 _invalidStakeExpiration) public {
        vm.assume(_invalidStakeExpiration < _claimExpiration);

        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            _claimExpiration,
            _invalidStakeExpiration, // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidExpiration.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNotDisputePeriod() public {
        testPropose(1 ether);

        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.NotDisputePeriod.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNotWhitelisted() public {
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(notWhitelistedUser);
        vm.expectRevert(IStorage.NotWhitelisted.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNoDeposit() public {
        vm.prank(deployer);
        s.whitelistUser(notWhitelistedUser);

        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(notWhitelistedUser);
        vm.expectRevert(); // arithmetic underflow or overflow
        claimMarket.propose(_propose);
    }

    // ==============================================================
    // Stake
    // ==============================================================

    function testStakeYea(uint256 _amount) public {
        testPropose(_amount);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);
        uint256 _bobBalanceBefore = s.userBalance(bob);
        uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(bob);
        claimMarket.stake(marketId, _amount, true);

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStake: E0");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStake: E1");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStake: E2");
        assertEq(s.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStake: E3");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 2, "testStake: E4");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStake: E5");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[1], bob, "testStake: E5");
        assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.Yea), "testStake: E6");
        assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.None), "testStake: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = s.userBalance(yossi);
        uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(yossi);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStake: E8");
        assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStake: E9");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStake: E10");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStake: E11");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStake: E12");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], yossi, "testStake: E13");
        assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.Nay), "testStake: E14");
        assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.None), "testStake: E15");
    }

    function testStakeNay(uint256 _amount) public {
        testPropose(_amount);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);
        uint256 _bobBalanceBefore = s.userBalance(bob);
        uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));
        uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(bob);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStake: E0");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStake: E1");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStake: E2");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStake: E3");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStake: E4");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStake: E5");
        assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.Nay), "testStake: E6");
        assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.None), "testStake: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = s.userBalance(yossi);
        uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(yossi);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStake: E8");
        assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStake: E9");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStake: E10");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount * 2, "testStake: E11");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 2, "testStake: E12");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStake: E13");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[1], yossi, "testStake: E14");
        assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.Nay), "testStake: E15");
        assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(IStorage.VoteStatus.None), "testStake: E16");
    }

    // function stake(uint256 _marketId, uint256 _amount, bool _yea) external {
    //     if (_amount < marketMinStake[_marketId]) revert InvalidAmount();
    //     if (!isMarket[_marketId]) revert InvalidMarketType();

    //     uint256 _claimId = s.claimsLength(_marketId) - 1;
    //     IStorage.Stake memory _stake = s.claims(_marketId)[_claimId].stake;

    //     uint256 _expiration = _stake.expiration;
    //     if (_expiration < block.timestamp) revert NotStakingPeriod();

    //     bytes32 _claimKey = s.claimKey(_marketId, _claimId);
    //     if (s.userStake(msg.sender, _claimKey) == 0) {
    //         s.pushStaker(_marketId, _claimId, msg.sender, _yea);
    //     } else {
    //         if (s.userStakeStatus(msg.sender, _claimKey) == IStorage.VoteStatus.Yea && !_yea) revert InvalidStake();
    //         if (s.userStakeStatus(msg.sender, _claimKey) == IStorage.VoteStatus.Nay && _yea) revert InvalidStake();
    //     }

    //     uint256 _timeWeightedAmount = _amount;
    //     if (_claimId == 0) {
    //         uint256 _start = _stake.start;
    //         _timeWeightedAmount *= getPrice(block.timestamp - _start, _expiration - _start) / PRICE_PRECISION;
    //     }

    //     s.incrementUserStake(_amount, _timeWeightedAmount, msg.sender, _claimKey);
    //     s.incrementClaimStake(_timeWeightedAmount, _marketId, _claimId, _yea);

    //     emit Stake(msg.sender, _marketId, _claimId, _amount, _yea);
    // }

    function testStakeDecay(uint256 _amount) public {
        testPropose(_amount);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount);

        uint256 _halvingTime = (s.claims(marketId)[_claimId].stake.expiration - s.claims(marketId)[_claimId].stake.start) / claimMarket.numHalves();
        skip(_halvingTime);

        vm.prank(bob);
        claimMarket.stake(marketId, _amount, false);
        console.log("bob stake: %s", s.userStake(bob, s.claimKey(marketId, _claimId)));
        console.log("alice stake: %s", s.userStake(alice, s.claimKey(marketId, _claimId)));
        revert("asd"); // @todo - here
    }

    // function testGetPrice
    // function testStakeInvalidAmount
    // function InvalidMarketType
    // function testStakeNotStakingPeriod
    // function testStakeInvalidStake

    // ==============================================================
    // PrepareVote
    // ==============================================================

    // ==============================================================
    // Vote
    // ==============================================================

    // ==============================================================
    // EndVote
    // ==============================================================

    // ==============================================================
    // Resolve
    // ==============================================================

    // ==============================================================
    // CommitteeResolve
    // ==============================================================

    // ==============================================================
    // ClaimProceeds
    // ==============================================================

    // ==============================================================
    // Dispute #1
    // ==============================================================

    // function testProposeDispute
    // function testProposeDisputeInvalidReferenceMarkedId
    // function testProposeDisputeInvalidMarketId
    // function testProposeDisputeInvalidMarketType
    // function testProposeMaxClaimsReached
    // function testProposeNotNullifyMarket

    // ==============================================================
    // Dispute #2
    // ==============================================================

    // ==============================================================
    // Dispute #3
    // ==============================================================
}