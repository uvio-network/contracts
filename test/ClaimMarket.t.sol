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

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            _amount,
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
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
        assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.Active), "testPropose: E7");
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
        assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.None), "testPropose: E20");
        assertEq(s.claims(marketId)[_claimId].proposer, alice, "testPropose: E21");
        assertEq(s.claims(marketId)[_claimId].stake.start, block.timestamp, "testPropose: E22");
    }

    function testProposeInvalidPriceParamsInvalidCurveType(uint8 _invalidCurveType) public {
        vm.assume(_invalidCurveType != 0);

        DataTypes.Price memory _price = DataTypes.Price(_invalidCurveType, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE,
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidPriceParams.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidPriceParamsInvalidSteepness(uint256 _invalidSteepness) public {
        vm.assume(_invalidSteepness > HALVES);

        DataTypes.Price memory _price = DataTypes.Price(0, _invalidSteepness);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE,
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidPriceParams.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidMinStake(uint256 _invalidMinStake) public {
        vm.assume(_invalidMinStake < MIN_STAKE);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            0, // marketId
            0, // refMarketId
            0, // amount
            _invalidMinStake,
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidMinStake.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidAmount(uint256 _invalidAmount) public {
        vm.assume(_invalidAmount < MIN_STAKE);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            marketId,
            0, // refMarketId
            _invalidAmount,
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidAmount.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidClaimExpiration(uint40 _invalidClaimExpiration) public {
        vm.assume(_invalidClaimExpiration < block.timestamp + MIN_CLAIM_DURATION);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            _invalidClaimExpiration, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidExpiration.selector);
        claimMarket.propose(_propose);
    }

    function testProposeInvalidStakeExpiration(uint40 _claimExpiration, uint40 _invalidStakeExpiration) public {
        vm.assume(_claimExpiration < (52 weeks * 100) && _invalidStakeExpiration < _claimExpiration);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            _claimExpiration,
            _invalidStakeExpiration, // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.InvalidExpiration.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNotDisputePeriod() public {
        testPropose(1 ether);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(alice);
        vm.expectRevert(IMarket.NotDisputePeriod.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNotWhitelisted() public {
        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
        );
        vm.prank(notWhitelistedUser);
        vm.expectRevert(IStorage.NotWhitelisted.selector);
        claimMarket.propose(_propose);
    }

    function testProposeNoDeposit() public {
        vm.prank(deployer);
        s.whitelistUser(notWhitelistedUser);

        DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            marketId,
            0, // refMarketId
            MIN_STAKE, // amount
            MIN_STAKE, // 0.1 ether
            uint40(block.timestamp) + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true, // yea
            _price
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

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeYea: E0");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeYea: E1");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeYea: E2");
        assertEq(s.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStakeYea: E3");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 2, "testStakeYea: E4");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeYea: E5");
        assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[1], bob, "testStakeYea: E5");
        assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testStakeYea: E6");
        assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeYea: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = s.userBalance(yossi);
        uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(yossi);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeYea: E8");
        assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeYea: E9");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeYea: E10");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStakeYea: E11");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeYea: E12");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], yossi, "testStakeYea: E13");
        assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeYea: E14");
        assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeYea: E15");
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

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeNay: E0");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeNay: E1");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeNay: E2");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStakeNay: E3");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeNay: E4");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E5");
        assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeNay: E6");
        assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeNay: E7");

        _deposit(yossi, _amount);
        uint256 _yossiBalanceBefore = s.userBalance(yossi);
        uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
        _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
        vm.prank(yossi);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeNay: E8");
        assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeNay: E9");
        assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeNay: E10");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _amount * 2, "testStakeNay: E11");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 2, "testStakeNay: E12");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E13");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[1], yossi, "testStakeNay: E14");
        assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeNay: E15");
        assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeNay: E16");
    }

    function testStakeExponentialDecay(uint256 _amount) public {
        testPropose(_amount);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        DataTypes.Stake memory _stake = s.claims(marketId)[_claimId].stake;
        uint256 _halvingTime = (_stake.expiration - _stake.start) / _stake.price.steepness;

        _deposit(bob, _amount);
        skip(_halvingTime);
        uint256 _bobBalanceBefore = s.userBalance(bob);
        vm.prank(bob);
        uint256 _bobWeightedStake = claimMarket.stake(marketId, _amount, false);

        _deposit(yossi, _amount);
        skip(_halvingTime);
        uint256 _yossiBalanceBefore = s.userBalance(yossi);
        vm.prank(yossi);
        uint256 _yossiWeightedStake = claimMarket.stake(marketId, _amount, true);

        assertEq(_bobWeightedStake, s.userStake(bob, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E0");
        assertEq(_yossiWeightedStake, s.userStake(yossi, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E1");
        assertEq(_bobWeightedStake, s.userStake(alice, s.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E2");
        assertEq(_yossiWeightedStake, s.userStake(bob, s.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E3");
        assertEq(s.claims(marketId)[_claimId].stake.yea, _yossiWeightedStake + s.userStake(alice, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E4");
        assertEq(s.claims(marketId)[_claimId].stake.nay, _bobWeightedStake, "testStakeExponentialDecay: E5");
        assertEq(_bobBalanceBefore - _amount, s.userBalance(bob), "testStakeExponentialDecay: E6");
        assertEq(_yossiBalanceBefore - _amount, s.userBalance(yossi), "testStakeExponentialDecay: E7");
    }

    function testStakeTwice(uint256 _amount) public {
        testPropose(_amount);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

        _deposit(bob, _amount * 2);

        uint256 _bobBalanceBefore = s.userBalance(bob);
        uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));

        vm.prank(bob);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E0");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E1");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E2");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E3");

        _bobBalanceBefore = s.userBalance(bob);
        _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));

        vm.prank(bob);
        claimMarket.stake(marketId, _amount, false);

        assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E3");
        assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E4");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E5");
        assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E6");
    }

    function testStakeInvalidAmount(uint256 _invalidAmount) public {
        testPropose(MIN_STAKE);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        vm.assume(_invalidAmount < _getMarketMinStake(_claimId));

        vm.prank(bob);
        vm.expectRevert(IMarket.InvalidAmount.selector);
        claimMarket.stake(marketId, _invalidAmount, true);
    }

    function testStakeInvalidMarketType(uint256 _invalidMarketId) public {
        vm.assume(_invalidMarketId != marketId);
        vm.prank(bob);
        vm.expectRevert(IMarket.InvalidMarketType.selector);
        claimMarket.stake(_invalidMarketId, MIN_STAKE, true);
    }

    function testStakeNotStakingPeriod() public {
        testPropose(MIN_STAKE);

        uint256 _claimId = s.claimsLength(marketId) - 1;
        uint256 _expiration = s.claims(marketId)[_claimId].stake.expiration;
        skip(_expiration - block.timestamp + 1);

        vm.prank(bob);
        vm.expectRevert(IMarket.NotStakingPeriod.selector);
        claimMarket.stake(marketId, MIN_STAKE, true);
    }

    function testStakeInvalidStake() public {
        testPropose(MIN_STAKE);

        _deposit(bob, MIN_STAKE);
        vm.prank(bob);
        claimMarket.stake(marketId, MIN_STAKE, true);

        vm.prank(bob);
        vm.expectRevert(IMarket.InvalidStake.selector);
        claimMarket.stake(marketId, MIN_STAKE, false);

        _deposit(yossi, MIN_STAKE);
        vm.prank(yossi);
        claimMarket.stake(marketId, MIN_STAKE, false);

        vm.prank(yossi);
        vm.expectRevert(IMarket.InvalidStake.selector);
        claimMarket.stake(marketId, MIN_STAKE, true);
    }

    // ==============================================================
    // PrepareVote
    // ==============================================================

    // function prepareVote( // @todo - here
    //     address[] calldata _yeaVoters,
    //     address[] calldata _nayVoters,
    //     uint256 _marketId
    // ) external {
    //     if (msg.sender != randomizer) revert OnlyRandomizer();
    //     if (!isMarket[_marketId]) revert InvalidMarketType();

    //     uint256 _claimId = s.claimsLength(_marketId) - 1;
    //     DataTypes.Claim memory _claim = s.claims(_marketId)[_claimId];
    //     if (_claim.expiration > block.timestamp) revert ClaimNotExpired();
    //     if (_claim.status != DataTypes.ClaimStatus.Active) revert ClaimNotActive();

    //     s.setVoteExpiration(uint40(block.timestamp) + votingDuration, _marketId, _claimId);
    //     s.setVoters(_yeaVoters, _nayVoters, _marketId, _claimId);
    //     s.setClaimStatus(DataTypes.ClaimStatus.PendingVote, _marketId, _claimId);

    //     emit PrepareVote(_marketId);
    // }

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