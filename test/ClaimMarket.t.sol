// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.25;

// import "./Base.sol";

// contract ClaimMarketTest is Base {

//     uint256 public marketId = 0;

//     function setUp() public override {
//         Base.setUp();

//         vm.prank(alice);
//         IERC20(asset).approve(address(claimMarket), type(uint256).max);
//         vm.prank(bob);
//         IERC20(asset).approve(address(claimMarket), type(uint256).max);
//         vm.prank(yossi);
//         IERC20(asset).approve(address(claimMarket), type(uint256).max);

//         vm.startPrank(deployer);
//         s.whitelistUser(alice);
//         s.whitelistUser(bob);
//         s.whitelistUser(yossi);
//         vm.stopPrank();
//     }

//     // ==============================================================
//     // Setup
//     // ==============================================================

//     function testSetup() public view {
//         assertEq(claimMarket.maxClaims(), MAX_CLAIMS, "testSetup: E0");
//         assertEq(claimMarket.minStake(), MIN_STAKE, "testSetup: E1");
//         assertEq(claimMarket.minClaimDuration(), MIN_CLAIM_DURATION, "testSetup: E2");
//         assertEq(claimMarket.votersLimit(), VOTERS_LIMIT, "testSetup: E3");
//         assertEq(claimMarket.votingDuration(), VOTING_DURATION, "testSetup: E4");
//         assertEq(claimMarket.disputeDuration(), DISPUTE_DURATION, "testSetup: E5");
//         assertEq(claimMarket.fee(), FEE, "testSetup: E6");
//         assertEq(claimMarket.randomizer(), address(randomizer), "testSetup: E7");
//         assertEq(address(claimMarket.s()), address(s), "testSetup: E8");
//         assertEq(address(claimMarket.nullifyMarket()), address(nullifyMarket), "testSetup: E9");
//         assertEq(claimMarket.owner(), deployer, "testSetup: E10");
//         assertEq(claimMarket.minStakeIncrease(), MIN_STAKE_INCREASE, "testSetup: E11");
//     }

//     // ==============================================================
//     // Propose
//     // ==============================================================

//     function testProposeYea(uint256 _amount) public {
//         vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

//         _deposit(alice, _amount);

//         uint256 _claimId = s.claimsLength(marketId);
//         bytes32 _claimKey = s.claimKey(marketId, _claimId);
//         uint256 _userBalanceBalanceBefore = s.userBalance(alice);
//         uint256 _userStakeBefore = s.userStake(alice, _claimKey);
//         uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             _amount,
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         claimMarket.propose(_propose, 0);

//         assertEq(s.userBalance(alice), _userBalanceBalanceBefore - _amount, "testProposeYea: E0");
//         assertEq(s.userStake(alice, _claimKey), _userStakeBefore + _amount, "testProposeYea: E1");
//         assertTrue(claimMarket.isMarket(marketId), "testProposeYea: E2");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testProposeYea: E3");
//         assertEq(claimMarket.marketMinStake(marketId), _getMarketMinStake(_claimId), "testProposeYea: E4");
//         assertEq(s.claims(marketId)[_claimId].metadataURI, "metadataURI", "testProposeYea: E5");
//         assertEq(s.claims(marketId)[_claimId].expiration, block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), "testProposeYea: E6");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.Active), "testProposeYea: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _amount, "testProposeYea: E8");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, 0, "testProposeYea: E9");
//         assertEq(s.claims(marketId)[_claimId].stake.expiration, block.timestamp + MIN_CLAIM_DURATION, "testProposeYea: E10");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testProposeYea: E11");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testProposeYea: E12");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 0, "testProposeYea: E13");
//         assertEq(s.claims(marketId)[_claimId].vote.yea, 0, "testProposeYea: E14");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testProposeYea: E15");
//         assertEq(s.claims(marketId)[_claimId].vote.expiration, 0, "testProposeYea: E16");
//         assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, 0, "testProposeYea: E17");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 0, "testProposeYea: E18");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 0, "testProposeYea: E19");
//         assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.None), "testProposeYea: E20");
//         assertEq(s.claims(marketId)[_claimId].proposer, alice, "testProposeYea: E21");
//         assertEq(s.claims(marketId)[_claimId].stake.start, block.timestamp, "testProposeYea: E22");
//         assertEq(uint8(s.userStakeStatus(alice, _claimKey)), uint8(DataTypes.VoteStatus.Yea), "testProposeYea: E23");
//     }

//     function testProposeNay(uint256 _amount) public {
//         vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

//         _deposit(alice, _amount);

//         uint256 _claimId = s.claimsLength(marketId);
//         bytes32 _claimKey = s.claimKey(marketId, _claimId);
//         uint256 _userBalanceBalanceBefore = s.userBalance(alice);
//         uint256 _userStakeBefore = s.userStake(bob, _claimKey);
//         uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             _amount,
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             false, // nay
//             _price
//         );
//         vm.prank(alice);
//         claimMarket.propose(_propose, 0);

//         assertEq(s.userBalance(alice), _userBalanceBalanceBefore - _amount, "testProposeNay: E0");
//         assertEq(s.userStake(alice, _claimKey), _userStakeBefore + _amount, "testProposeNay: E1");
//         assertTrue(claimMarket.isMarket(marketId), "testProposeNay: E2");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testProposeNay: E3");
//         assertEq(claimMarket.marketMinStake(marketId), _getMarketMinStake(_claimId), "testProposeNay: E4");
//         assertEq(s.claims(marketId)[_claimId].metadataURI, "metadataURI", "testProposeNay: E5");
//         assertEq(s.claims(marketId)[_claimId].expiration, block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), "testProposeNay: E6");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.Active), "testProposeNay: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, 0, "testProposeNay: E8");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testProposeNay: E9");
//         assertEq(s.claims(marketId)[_claimId].stake.expiration, block.timestamp + MIN_CLAIM_DURATION, "testProposeNay: E10");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 0, "testProposeNay: E11");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testProposeNay: E12");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], alice, "testProposeNay: E13");
//         assertEq(s.claims(marketId)[_claimId].vote.yea, 0, "testProposeNay: E14");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testProposeNay: E15");
//         assertEq(s.claims(marketId)[_claimId].vote.expiration, 0, "testProposeNay: E16");
//         assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, 0, "testProposeNay: E17");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 0, "testProposeNay: E18");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 0, "testProposeNay: E19");
//         assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.None), "testProposeNay: E20");
//         assertEq(s.claims(marketId)[_claimId].proposer, alice, "testProposeNay: E21");
//         assertEq(s.claims(marketId)[_claimId].stake.start, block.timestamp, "testProposeNay: E22");
//         assertEq(uint8(s.userStakeStatus(alice, _claimKey)), uint8(DataTypes.VoteStatus.Nay), "testProposeNay: E23");
//     }

//     function testProposeInvalidPriceParamsInvalidCurveType(uint8 _invalidCurveType) public {
//         vm.assume(_invalidCurveType != 0);

//         DataTypes.Price memory _price = DataTypes.Price(_invalidCurveType, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE,
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidPriceParams.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeInvalidPriceParamsInvalidSteepness(uint256 _invalidSteepness) public {
//         vm.assume(_invalidSteepness > HALVES);

//         DataTypes.Price memory _price = DataTypes.Price(0, _invalidSteepness);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE,
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidPriceParams.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeInvalidAmount(uint256 _invalidAmount) public {
//         vm.assume(_invalidAmount < MIN_STAKE);

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             _invalidAmount,
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidAmount.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeInvalidClaimExpiration(uint40 _invalidClaimExpiration) public {
//         vm.assume(
//             _invalidClaimExpiration > claimMarket.MIN_STAKE_FREEZE_DURATION() &&
//             _invalidClaimExpiration < block.timestamp + MIN_CLAIM_DURATION
//         );

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE, // amount
//             _invalidClaimExpiration, // claimExpiration
//             _invalidClaimExpiration - claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidExpiration.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeInvalidStakeExpiration(uint40 _claimExpiration, uint40 _invalidStakeExpiration) public {
//         vm.assume(
//             _claimExpiration < (52 weeks * 100) &&
//             _invalidStakeExpiration < _claimExpiration + claimMarket.MIN_STAKE_FREEZE_DURATION()
//         );

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE, // amount
//             _claimExpiration,
//             _invalidStakeExpiration, // stakingExpiration, 1 week + 1 day
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidExpiration.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeNotDisputePeriod() public {
//         testProposeYea(1 ether);

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "",
//             marketId,
//             MIN_STAKE * 2, // amount
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(alice);
//         vm.expectRevert(IMarket.NotDisputePeriod.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeNotWhitelisted() public {
//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE, // amount
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(notWhitelistedUser);
//         vm.expectRevert(IStorage.NotWhitelisted.selector);
//         claimMarket.propose(_propose, 0);
//     }

//     function testProposeNoDeposit() public {
//         vm.prank(deployer);
//         s.whitelistUser(notWhitelistedUser);

//         DataTypes.Price memory _price = DataTypes.Price(0, HALVES);
//         DataTypes.Propose memory _propose = DataTypes.Propose(
//             "metadataURI",
//             marketId,
//             MIN_STAKE, // amount
//             uint40(block.timestamp) + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // claimExpiration, 1 week + 1 day
//             uint40(block.timestamp) + MIN_CLAIM_DURATION, // stakingExpiration, 1 week
//             true, // yea
//             _price
//         );
//         vm.prank(notWhitelistedUser);
//         vm.expectRevert(); // arithmetic underflow or overflow
//         claimMarket.propose(_propose, 0);
//     }

//     // ==============================================================
//     // Stake
//     // ==============================================================

//     function testStakeYea(uint256 _amount) public {
//         testProposeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         _deposit(bob, _amount);
//         uint256 _bobBalanceBefore = s.userBalance(bob);
//         uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));
//         uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
//         vm.prank(bob);
//         claimMarket.stake(marketId, _amount, true);

//         assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeYea: E0");
//         assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeYea: E1");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeYea: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStakeYea: E3");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 2, "testStakeYea: E4");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeYea: E5");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[1], bob, "testStakeYea: E5");
//         assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testStakeYea: E6");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeYea: E7");

//         _deposit(yossi, _amount);
//         uint256 _yossiBalanceBefore = s.userBalance(yossi);
//         uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
//         _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
//         vm.prank(yossi);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeYea: E8");
//         assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeYea: E9");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeYea: E10");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStakeYea: E11");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeYea: E12");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], yossi, "testStakeYea: E13");
//         assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeYea: E14");
//         assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeYea: E15");
//     }

//     function testStakeNay(uint256 _amount) public {
//         testProposeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         _deposit(bob, _amount);
//         uint256 _bobBalanceBefore = s.userBalance(bob);
//         uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));
//         uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
//         vm.prank(bob);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeNay: E0");
//         assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeNay: E1");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeNay: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStakeNay: E3");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeNay: E4");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E5");
//         assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeNay: E6");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeNay: E7");

//         _deposit(yossi, _amount);
//         uint256 _yossiBalanceBefore = s.userBalance(yossi);
//         uint256 _yossiStakeBefore = s.userStake(yossi, s.claimKey(marketId, _claimId));
//         _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
//         vm.prank(yossi);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(yossi), _yossiBalanceBefore - _amount, "testStakeNay: E8");
//         assertEq(s.userStake(yossi, s.claimKey(marketId, _claimId)), _yossiStakeBefore + _amount, "testStakeNay: E9");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeNay: E10");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _amount * 2, "testStakeNay: E11");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 2, "testStakeNay: E12");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeNay: E13");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[1], yossi, "testStakeNay: E14");
//         assertEq(uint8(s.userStakeStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeNay: E15");
//         assertEq(uint8(s.userVoteStatus(yossi, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeNay: E16");
//     }

//     function testStakeTie(uint256 _amount) public {
//         testProposeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         _deposit(bob, _amount);
//         uint256 _bobBalanceBefore = s.userBalance(bob);
//         uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));
//         uint256 _storageBalanceBefore = IERC20(asset).balanceOf(address(s));
//         vm.prank(bob);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTie: E0");
//         assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTie: E1");
//         assertEq(IERC20(asset).balanceOf(address(s)), _storageBalanceBefore, "testStakeTie: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _amount, "testStakeTie: E3");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testStakeTie: E4");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeTie: E5");
//         assertEq(uint8(s.userStakeStatus(alice, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testStakeTie: E6");
//         assertEq(uint8(s.userVoteStatus(alice, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeTie: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _amount, "testStakeTie: E8");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTie: E9");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTie: E10");
//         assertEq(uint8(s.userStakeStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testStakeTie: E11");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.None), "testStakeTie: E12");
//     }

//     function testStakeExponentialDecay(uint256 _amount) public {
//         testProposeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         DataTypes.Stake memory _stake = s.claims(marketId)[_claimId].stake;
//         uint256 _halvingTime = (_stake.expiration - _stake.start) / _stake.price.steepness;

//         _deposit(bob, _amount);
//         skip(_halvingTime);
//         uint256 _bobBalanceBefore = s.userBalance(bob);
//         vm.prank(bob);
//         uint256 _bobWeightedStake = claimMarket.stake(marketId, _amount, false);

//         _deposit(yossi, _amount);
//         skip(_halvingTime);
//         uint256 _yossiBalanceBefore = s.userBalance(yossi);
//         vm.prank(yossi);
//         uint256 _yossiWeightedStake = claimMarket.stake(marketId, _amount, true);

//         assertEq(_bobWeightedStake, s.userStake(bob, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E0");
//         assertEq(_yossiWeightedStake, s.userStake(yossi, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E1");
//         assertEq(_bobWeightedStake, s.userStake(alice, s.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E2");
//         assertEq(_yossiWeightedStake, s.userStake(bob, s.claimKey(marketId, _claimId)) / 2, "testStakeExponentialDecay: E3");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yossiWeightedStake + s.userStake(alice, s.claimKey(marketId, _claimId)), "testStakeExponentialDecay: E4");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _bobWeightedStake, "testStakeExponentialDecay: E5");
//         assertEq(_bobBalanceBefore - _amount, s.userBalance(bob), "testStakeExponentialDecay: E6");
//         assertEq(_yossiBalanceBefore - _amount, s.userBalance(yossi), "testStakeExponentialDecay: E7");
//     }

//     function testStakeAfterPropose(uint256 _amount) public {
//         vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

//         testProposeYea(_amount);

//         _deposit(alice, _amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         bytes32 _claimKey = s.claimKey(marketId, _claimId);
//         uint256 _userBalanceBalanceBefore = s.userBalance(alice);
//         uint256 _userStakeBefore = s.userStake(alice, _claimKey);

//         vm.prank(alice);
//         claimMarket.stake(marketId, _amount, true);

//         assertEq(s.userBalance(alice), _userBalanceBalanceBefore - _amount, "testStakeAfterPropose: E0");
//         assertEq(s.userStake(alice, _claimKey), _userStakeBefore + _amount, "testStakeAfterPropose: E1");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _amount * 2, "testStakeAfterPropose: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testStakeAfterPropose: E3");
//         assertEq(s.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testStakeAfterPropose: E4");
//         assertEq(uint8(s.userStakeStatus(alice, _claimKey)), uint8(DataTypes.VoteStatus.Yea), "testStakeAfterPropose: E5");

//         vm.prank(alice);
//         vm.expectRevert(IMarket.InvalidStake.selector);
//         claimMarket.stake(marketId, _amount, false);
//     }

//     function testStakeTwice(uint256 _amount) public {
//         testProposeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         _deposit(bob, _amount * 2);

//         uint256 _bobBalanceBefore = s.userBalance(bob);
//         uint256 _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));

//         vm.prank(bob);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E0");
//         assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E1");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E3");

//         _bobBalanceBefore = s.userBalance(bob);
//         _bobStakeBefore = s.userStake(bob, s.claimKey(marketId, _claimId));

//         vm.prank(bob);
//         claimMarket.stake(marketId, _amount, false);

//         assertEq(s.userBalance(bob), _bobBalanceBefore - _amount, "testStakeTwice: E3");
//         assertEq(s.userStake(bob, s.claimKey(marketId, _claimId)), _bobStakeBefore + _amount, "testStakeTwice: E4");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers.length, 1, "testStakeTwice: E5");
//         assertEq(s.claims(marketId)[_claimId].stake.nayStakers[0], bob, "testStakeTwice: E6");
//     }

//     function testStakeInvalidAmount(uint256 _invalidAmount) public {
//         testProposeYea(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_invalidAmount < _getMarketMinStake(_claimId));

//         vm.prank(bob);
//         vm.expectRevert(IMarket.InvalidAmount.selector);
//         claimMarket.stake(marketId, _invalidAmount, true);
//     }

//     function testStakeInvalidMarketType(uint256 _invalidMarketId) public {
//         vm.assume(_invalidMarketId != marketId);
//         vm.prank(bob);
//         vm.expectRevert(IMarket.InvalidMarketType.selector);
//         claimMarket.stake(_invalidMarketId, MIN_STAKE, true);
//     }

//     function testStakeNotStakingPeriod() public {
//         testProposeYea(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].stake.expiration;
//         skip(_expiration - block.timestamp + 1);

//         vm.prank(bob);
//         vm.expectRevert(IMarket.NotStakingPeriod.selector);
//         claimMarket.stake(marketId, MIN_STAKE, true);
//     }

//     function testStakeInvalidStake() public {
//         testProposeYea(MIN_STAKE);

//         _deposit(bob, MIN_STAKE);
//         vm.prank(bob);
//         claimMarket.stake(marketId, MIN_STAKE, true);

//         vm.prank(bob);
//         vm.expectRevert(IMarket.InvalidStake.selector);
//         claimMarket.stake(marketId, MIN_STAKE, false);

//         _deposit(yossi, MIN_STAKE);
//         vm.prank(yossi);
//         claimMarket.stake(marketId, MIN_STAKE, false);

//         vm.prank(yossi);
//         vm.expectRevert(IMarket.InvalidStake.selector);
//         claimMarket.stake(marketId, MIN_STAKE, true);
//     }

//     // ==============================================================
//     // PrepareVote
//     // ==============================================================

//     function testPrepareVoteYea(uint256 _amount) public {
//         testStakeYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         randomizer.prepareVote(_yeaVoters, _nayVoters, marketId, true);

//         assertEq(s.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteYea: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteYea: E1");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteYea: E2");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteYea: E3");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters[0], yossi, "testPrepareVoteYea: E4");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingVote), "testPrepareVoteYea: E5");
//     }

//     function testPrepareVoteNay(uint256 _amount) public {
//         testStakeNay(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         randomizer.prepareVote(_yeaVoters, _nayVoters, marketId, true);

//         assertEq(s.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteNay: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteNay: E1");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteNay: E2");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteNay: E3");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters[0], yossi, "testPrepareVoteNay: E4");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingVote), "testPrepareVoteNay: E5");
//     }

//     function testPrepareVoteTie(uint256 _amount) public {
//         testStakeTie(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = bob;
//         randomizer.prepareVote(_yeaVoters, _nayVoters, marketId, true);

//         assertEq(s.claims(marketId)[_claimId].vote.expiration, block.timestamp + VOTING_DURATION, "testPrepareVoteTie: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters.length, 1, "testPrepareVoteTie: E1");
//         assertEq(s.claims(marketId)[_claimId].vote.yeaVoters[0], alice, "testPrepareVoteTie: E2");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters.length, 1, "testPrepareVoteTie: E3");
//         assertEq(s.claims(marketId)[_claimId].vote.nayVoters[0], bob, "testPrepareVoteTie: E4");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingVote), "testPrepareVoteTie: E5");
//     }

//     function testPrepareVoteOnlyRandomizer() public {
//         testProposeYea(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         vm.prank(bob);
//         vm.expectRevert(IMarket.OnlyRandomizer.selector);
//         claimMarket.prepareVote(_yeaVoters, _nayVoters, marketId);
//     }

//     function testPrepareVoteInvalidMarketType() public {
//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         vm.prank(address(randomizer));
//         vm.expectRevert(IMarket.InvalidMarketType.selector);
//         claimMarket.prepareVote(_yeaVoters, _nayVoters, marketId + 1);
//     }

//     function testPrepareVoteClaimNotExpired() public {
//         testProposeYea(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp - 1);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         vm.prank(address(randomizer));
//         vm.expectRevert(IMarket.ClaimNotExpired.selector);
//         claimMarket.prepareVote(_yeaVoters, _nayVoters, marketId);
//     }

//     function testPrepareVoteClaimNotActive() public {
//         testProposeYea(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].expiration;
//         skip(_expiration - block.timestamp);

//         address[] memory _yeaVoters = new address[](1);
//         _yeaVoters[0] = alice;
//         address[] memory _nayVoters = new address[](1);
//         _nayVoters[0] = yossi;
//         vm.prank(address(randomizer));
//         claimMarket.prepareVote(_yeaVoters, _nayVoters, marketId);

//         vm.prank(address(randomizer));
//         vm.expectRevert(IMarket.ClaimNotActive.selector);
//         claimMarket.prepareVote(_yeaVoters, _nayVoters, marketId);
//     }

//     // ==============================================================
//     // Vote
//     // ==============================================================

//     // bob votes against his stake
//     function testVoteYea(uint256 _amount) public {
//         testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _yeaStakeBefore = s.claims(marketId)[_claimId].stake.yea;
//         uint256 _nayStakeBefore = s.claims(marketId)[_claimId].stake.nay;

//         vm.prank(alice);
//         claimMarket.vote(marketId, true, true);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 1, "testVoteYea: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testVoteYea: E1");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteYea: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteYea: E3");
//         assertEq(uint8(s.userVoteStatus(alice, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testVoteYea: E4");

//         vm.prank(bob);
//         claimMarket.vote(marketId, true, false);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 2, "testVoteYea: E5");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testVoteYea: E6");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore + _amount, "testVoteYea: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore - _amount, "testVoteYea: E8");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testVoteYea: E9");
//     }

//     // alice votes against her stake
//     function testVoteNay(uint256 _amount) public {
//         testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _yeaStakeBefore = s.claims(marketId)[_claimId].stake.yea;
//         uint256 _nayStakeBefore = s.claims(marketId)[_claimId].stake.nay;

//         vm.prank(alice);
//         claimMarket.vote(marketId, false, true);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 0, "testVoteNay: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 1, "testVoteNay: E1");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore - _amount, "testVoteNay: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore + _amount, "testVoteNay: E3");
//         assertEq(uint8(s.userVoteStatus(alice, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testVoteNay: E4");

//         vm.prank(bob);
//         claimMarket.vote(marketId, false, false);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 0, "testVoteNay: E5");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 2, "testVoteNay: E6");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore - _amount, "testVoteNay: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore + _amount, "testVoteNay: E8");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testVoteNay: E9");
//     }

//     // everyone votes for their stake
//     function testVoteTie(uint256 _amount) public {
//         testPrepareVoteTie(_amount); // alice staked yea, bob staked nay

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         vm.assume(_amount >= _getMarketMinStake(_claimId) && _amount <= 100 ether);

//         uint256 _yeaStakeBefore = s.claims(marketId)[_claimId].stake.yea;
//         uint256 _nayStakeBefore = s.claims(marketId)[_claimId].stake.nay;

//         vm.prank(alice);
//         claimMarket.vote(marketId, true, true);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 1, "testVoteTie: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 0, "testVoteTie: E1");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteTie: E2");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteTie: E3");
//         assertEq(uint8(s.userVoteStatus(alice, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Yea), "testVoteTie: E4");

//         vm.prank(bob);
//         claimMarket.vote(marketId, false, false);

//         assertEq(s.claims(marketId)[_claimId].vote.yea, 1, "testVoteTie: E5");
//         assertEq(s.claims(marketId)[_claimId].vote.nay, 1, "testVoteTie: E6");
//         assertEq(s.claims(marketId)[_claimId].stake.yea, _yeaStakeBefore, "testVoteTie: E7");
//         assertEq(s.claims(marketId)[_claimId].stake.nay, _nayStakeBefore, "testVoteTie: E8");
//         assertEq(uint8(s.userVoteStatus(bob, s.claimKey(marketId, _claimId))), uint8(DataTypes.VoteStatus.Nay), "testVoteTie: E9");
//     }

//     function testVoteInvalidMarketType() public {
//         vm.prank(bob);
//         vm.expectRevert(IMarket.InvalidMarketType.selector);
//         claimMarket.vote(marketId + 1, true, true);
//     }

//     function testVoteNotVotingPeriod() public {
//         testPrepareVoteTie(MIN_STAKE);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].vote.expiration;
//         skip(_expiration - block.timestamp + 1);

//         vm.prank(bob);
//         vm.expectRevert(IMarket.NotVotingPeriod.selector);
//         claimMarket.vote(marketId, true, true);
//     }

//     function testVoteNotVoter() public {
//         testPrepareVoteNay(MIN_STAKE);

//         vm.prank(yossi);
//         vm.expectRevert(IMarket.NotVoter.selector);
//         claimMarket.vote(marketId, true, true);
//     }

//     function testVoteAlreadyVoted() public {
//         testPrepareVoteNay(MIN_STAKE);

//         vm.prank(alice);
//         claimMarket.vote(marketId, true, true);

//         vm.prank(alice);
//         vm.expectRevert(IStorage.AlreadyVoted.selector);
//         claimMarket.vote(marketId, true, true);
//     }

//     // ==============================================================
//     // EndVote
//     // ==============================================================

//     function testEndVoteYea(uint256 _amount) public {
//         testVoteYea(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].vote.expiration;
//         skip(_expiration - block.timestamp);

//         claimMarket.endVote(marketId);

//         assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.Yea), "testEndVoteYea: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteYea: E1");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingResolution), "testEndVoteYea: E2");
//     }

//     function testEndVoteNay(uint256 _amount) public {
//         testVoteNay(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].vote.expiration;
//         skip(_expiration - block.timestamp);

//         claimMarket.endVote(marketId);

//         assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.Nay), "testEndVoteNay: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteNay: E1");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingResolution), "testEndVoteNay: E2");
//     }

//     function testEndVoteTie(uint256 _amount) public {
//         testVoteTie(_amount);

//         uint256 _claimId = s.claimsLength(marketId) - 1;
//         uint256 _expiration = s.claims(marketId)[_claimId].vote.expiration;
//         skip(_expiration - block.timestamp);

//         claimMarket.endVote(marketId);

//         assertEq(uint8(s.claims(marketId)[_claimId].vote.outcome), uint8(DataTypes.Outcome.Tie), "testEndVoteTie: E0");
//         assertEq(s.claims(marketId)[_claimId].vote.disputeExpiration, uint40(block.timestamp) + DISPUTE_DURATION, "testEndVoteTie: E1");
//         assertEq(uint8(s.claims(marketId)[_claimId].status), uint8(DataTypes.ClaimStatus.PendingResolution), "testEndVoteTie: E2");
//     }

//     function testEndVoteInvalidMarketType() public {
//         vm.prank(bob);
//         vm.expectRevert(IMarket.InvalidMarketType.selector);
//         claimMarket.endVote(marketId + 1);
//     }

//     function testEndVoteNotPendingVote() public {
//         testProposeYea(MIN_STAKE);

//         vm.prank(bob);
//         vm.expectRevert(IMarket.NotPendingVote.selector);
//         claimMarket.endVote(marketId);
//     }

//     function testEndVoteVotePeriodNotExpired() public {
//         testPrepareVoteTie(MIN_STAKE);

//         vm.prank(bob);
//         vm.expectRevert(IMarket.VotePeriodNotExpired.selector);
//         claimMarket.endVote(marketId);
//     }

//     // ==============================================================
//     // Resolve
//     // ==============================================================

//     // function resolve(uint256 _marketId) external { // @todo - here
//     //     if (!isMarket[_marketId]) revert InvalidMarketType();

//     //     bool isNullified_ = _isNullified(_marketId);
//     //     uint256 _claimId = s.claimsLength(_marketId) - 1;
//     //     DataTypes.Claim memory _lastClaim = s.claims(_marketId)[_claimId];
//     //     if (_lastClaim.status != DataTypes.ClaimStatus.PendingResolution) revert NotPendingResolution();
//     //     if (_lastClaim.vote.disputeExpiration > block.timestamp) revert DisputePeriodNotExpired();

//     //     while (_claimId >= 0) {
//     //         if (isNullified_) {
//     //             s.setClaimStatus(DataTypes.ClaimStatus.Nullified, _marketId, _claimId);
//     //         } else {
//     //             if (_lastClaim.vote.outcome == DataTypes.Outcome.Yea) {
//     //                 s.setClaimStatus(DataTypes.ClaimStatus.ResolvedYea, _marketId, _claimId);
//     //             } else if (_lastClaim.vote.outcome == DataTypes.Outcome.Nay) {
//     //                 s.setClaimStatus(DataTypes.ClaimStatus.ResolvedNay, _marketId, _claimId);
//     //             } else {
//     //                 s.setClaimStatus(DataTypes.ClaimStatus.PendingCommitteeResolution, _marketId, _claimId);
//     //             }
//     //         }

//     //         --_claimId;
//     //     }

//     //     emit Resolve(_marketId);
//     // }

//     // ==============================================================
//     // CommitteeResolve
//     // ==============================================================

//     // ==============================================================
//     // ClaimProceeds
//     // ==============================================================

//     // ==============================================================
//     // Dispute #1
//     // ==============================================================

//     // function testProposeDispute
//     // function testProposeDisputeInvalidReferenceMarkedId
//     // function testProposeDisputeInvalidMarketId
//     // function testProposeDisputeInvalidMarketType
//     // function testProposeMaxClaimsReached
//     // function testProposeNotNullifyMarket

//     // ==============================================================
//     // Dispute #2
//     // ==============================================================

//     // ==============================================================
//     // Dispute #3
//     // ==============================================================
// }