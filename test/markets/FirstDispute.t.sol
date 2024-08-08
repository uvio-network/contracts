// // SPDX-License-Identifier: MIT
// pragma solidity 0.8.25;

// import "../Base.sol";

// contract FirstDisputeTest is Base {

//     function setUp() public override {
//         Base.setUp();
//     }

//     // ==============================================================
//     // Propose
//     // ==============================================================

//     function testProposeFirstDispute(uint256 _amount, uint256 _secondAmount) public {
//         _getToFirstDisputePeriod(_amount);

//         uint256 _claimId = m.claimsLength(marketId);
//         uint256 _minStake = _getMarketMinStake(_claimId);
//         _deposit(alice, _minStake);

//         bytes32 _claimKey = m.claimKey(marketId, _claimId);
//         uint256 _userBalanceBalanceBefore = m.userBalance(alice);
//         uint256 _userStakeBefore = m.userStake(alice, _claimKey);
//         uint256 _marketsBalanceBefore = IERC20(asset).balanceOf(address(m));

//         IMarkets.Propose memory propose_ = IMarkets.Propose(
//             "metadataURI",
//             marketId,
//             0, // nullifyMarketId
//             _minStake, // amount
//             0, // claimExpiration
//             0, // stakingExpiration
//             true, // yea
//             true, // dispute
//             IMarkets.Price(0, 0)
//         );

//         vm.prank(alice);
//         m.propose(propose_);

//         assertEq(m.userBalance(alice), _userBalanceBalanceBefore - _minStake, "testProposeFirstDispute: E0");
//         assertEq(m.userStake(alice, _claimKey), _userStakeBefore + _minStake, "testProposeFirstDispute: E1");
//         assertEq(IERC20(asset).balanceOf(address(m)), _marketsBalanceBefore, "testProposeFirstDispute: E2");
//         assertEq(m.claimsLength(marketId), _claimId + 1, "testProposeFirstDispute: E3");
//         assertEq(m.nullifiedMarkets(marketId), 0, "testProposeFirstDispute: E4");
//         assertEq(m.marketMinStake(marketId), _minStake, "testProposeFirstDispute: E5");
//         assertEq(m.claims(marketId)[_claimId].metadataURI, "metadataURI", "testProposeFirstDispute: E6");
//         assertEq(m.claims(marketId)[_claimId].expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeFirstDispute: E7");
//         assertEq(m.claims(marketId)[_claimId].proposer, alice, "testProposeFirstDispute: E8");
//         assertEq(m.claims(marketId)[_claimId].isNullifyMarket, false, "testProposeFirstDispute: E9");
//         assertEq(m.claims(marketId)[_claimId].stake.yea, _minStake, "testProposeFirstDispute: E10");
//         assertEq(m.claims(marketId)[_claimId].stake.nay, 0, "testProposeFirstDispute: E11");
//         assertEq(m.claims(marketId)[_claimId].stake.expiration, uint40(block.timestamp) + MIN_CLAIM_DURATION, "testProposeFirstDispute: E12");
//         assertEq(m.claims(marketId)[_claimId].stake.start, uint40(block.timestamp), "testProposeFirstDispute: E13");
//         assertEq(m.claims(marketId)[_claimId].stake.price.steepness, 0, "testProposeFirstDispute: E14");
//         assertEq(m.claims(marketId)[_claimId].stake.price.curveType, 0, "testProposeFirstDispute: E15");
//         assertEq(m.claims(marketId)[_claimId].vote.yea, 0, "testProposeFirstDispute: E16");
//         assertEq(m.claims(marketId)[_claimId].vote.nay, 0, "testProposeFirstDispute: E17");
//         assertEq(m.claims(marketId)[_claimId].vote.disputeExpiration, 0, "testProposeFirstDispute: E18");
//         assertEq(m.claims(marketId)[_claimId].vote.yeaVoters.length, 0, "testProposeFirstDispute: E19");
//         assertEq(m.claims(marketId)[_claimId].vote.nayVoters.length, 0, "testProposeFirstDispute: E20");
//         assertEq(uint8(m.claims(marketId)[_claimId].vote.outcome), uint8(IMarkets.Outcome.None), "testProposeFirstDispute: E21");
//         assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.Active), "testProposeFirstDispute: E22");
//         assertEq(m.claims(marketId)[_claimId].stake.yeaStakers[0], alice, "testProposeFirstDispute: E23");
//         assertEq(m.claims(marketId)[_claimId].stake.yeaStakers.length, 1, "testProposeFirstDispute: E24");
//         assertEq(m.claims(marketId)[_claimId].stake.nayStakers.length, 0, "testProposeFirstDispute: E25");
//     }

//     // function propose(Propose memory _propose) external {

//     //     uint256 _claimId;
//     //     uint256 _minStake;
//     //     if (_propose.dispute) {
//     //         if (_propose.marketId >= marketId) revert InvalidMarketId();

//     //         // Make sure unused params are not set
//     //         if (_propose.nullifyMarketId != 0) revert InvalidNullifyMarketId();
//     //         if (_propose.price.steepness != 0 || _propose.price.curveType != 0) revert InvalidPriceParams();
//     //         if (_propose.claimExpiration != 0 || _propose.stakingExpiration != 0) revert InvalidExpiration();

//     //         _claimId = claimsLength[_propose.marketId];
//     //         if (_claimId > MAX_CLAIMS) revert MaxClaimsReached();

//     //         Claim memory _lastClaim = _claims[_propose.marketId][_claimId - 1];
//     //         if (
//     //             _lastClaim.vote.disputeExpiration < block.timestamp ||
//     //             uint8(_lastClaim.status) >= uint8(ClaimStatus.Nullified)
//     //         ) revert NotDisputePeriod();

//     //         _minStake = marketMinStake[_propose.marketId] * (PRECISION + minStakeIncrease) / PRECISION;

//     //         _propose.claimExpiration = uint40(block.timestamp) + minClaimDuration;
//     //         _propose.stakingExpiration = _propose.claimExpiration;
//     //     } else {
//     //         if (_propose.price.steepness > 0 && !priceProvider.checkPriceParams(_propose.price)) revert InvalidPriceParams();
//     //         if (
//     //             _propose.claimExpiration < uint40(block.timestamp) + minClaimDuration ||
//     //             _propose.claimExpiration < _propose.stakingExpiration + MIN_STAKE_FREEZE_DURATION
//     //         ) revert InvalidExpiration();

//     //         _minStake = minStake;
//     //         _propose.marketId = marketId++;

//     //         if (_propose.nullifyMarketId > 0) {
//     //             Claim memory _claim = _claims[_propose.nullifyMarketId][0];
//     //             if (
//     //                 uint8(_claim.status) >= uint8(ClaimStatus.Active) &&
//     //                 uint8(_claim.status) <= uint8(ClaimStatus.PendingCommitteeResolution) &&
//     //                 !_claim.isNullifyMarket &&
//     //                 _propose.yea
//     //             ) {
//     //                 nullifiedMarkets[_propose.nullifyMarketId] = _propose.marketId;
//     //             } else {
//     //                 revert InvalidNullifyMarketId();
//     //             }
//     //         }
//     //     }

//     //     if (_propose.amount < _minStake) revert InvalidAmount();
//     //     marketMinStake[_propose.marketId] = _minStake;

//     //     _createClaim(_propose, _claimId, msg.sender);

//     //     emit Proposed(_propose, _claimId);
//     // }

//     function testProposeFirstDisputeInvalidMarketId(uint256 _invalidMarketId) public {
//         _getToFirstDisputePeriod(MIN_STAKE);

//         uint256 _claimId = m.claimsLength(marketId);
//         uint256 _minStake = _getMarketMinStake(_claimId);
//         _deposit(alice, _minStake);

//         IMarkets.Propose memory propose_ = IMarkets.Propose(
//             "metadataURI",
//             marketId,
//             0, // nullifyMarketId
//             _minStake, // amount
//             0, // claimExpiration
//             0, // stakingExpiration
//             true, // yea
//             true, // dispute
//             IMarkets.Price(0, 0)
//         );

//         vm.prank(alice);
//         m.propose(propose_);

//         assertEq(m.claimsLength(marketId), _claimId, "testProposeFirstDisputeInvalidMarketId: E0");
//     }
//     // function testProposeFirstDisputeInvalidNullifyMarketId
//     // InvalidAddress
//     // function testProposeFirstDisputeInvalidPriceParams
//     // function testProposeFirstDisputeInvalidExpiration
//     // function testProposeFirstDisputeNotDisputePeriod
//     // function testProposeFirstDisputeInvalidAmount

//     // ==============================================================
//     // Internal helpers
//     // ==============================================================

//     function _getToFirstDisputePeriod(uint256 _amount) internal {
//         _propose(_amount); // alice proposes a claim, and stakes for yea
//         _stake(_amount, bob, false); // bob stakes for nay
//         _stake(_amount, yossi, false); // yossi stakes for nay

//         uint256 _claimId = m.claimsLength(marketId) - 1;
//         _prepareVote(m.claims(marketId)[_claimId].expiration);

//         _vote(alice, true, true); // alice votes yea
//         _vote(bob, false, false); // bob votes nay

//         _endVote(m.claims(marketId)[_claimId].vote.expiration);
//     }
// }