// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "./Base.sol";

contract ClaimMarketTest is Base {

    function setUp() public override {
        Base.setUp();

        vm.prank(alice);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);
        vm.prank(bob);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);
        vm.prank(yossi);
        IERC20(asset).approve(address(claimMarket), type(uint256).max);
    }

    // ==============================================================
    // Setup
    // ==============================================================

    function testSetup() public view {
        assertEq(claimMarket.maxClaims(), MAX_CLAIMS, "testSetup: E0");
        assertEq(claimMarket.minStake(), MIN_STAKE, "testSetup: E1");
        assertEq(claimMarket.minClaimDuration(), MIN_CLAIM_DURATION, "testSetup: E2");
        assertEq(claimMarket.votersLimit(), VOTERS_LIMIT, "testSetup: E3");
        assertEq(claimMarket.votingDuration(), VOTING_DURATION, "testSetup: E4");
        assertEq(claimMarket.disputeDuration(), DISPUTE_DURATION, "testSetup: E5");
        assertEq(claimMarket.fee(), FEE, "testSetup: E6");
        assertEq(claimMarket.randomizer(), address(randomizer), "testSetup: E7");
        assertEq(address(claimMarket.s()), address(s), "testSetup: E8");
        assertEq(address(claimMarket.nullifyMarket()), address(nullifyMarket), "testSetup: E9");
        assertEq(claimMarket.owner(), depoyer, "testSetup: E10");
    }

    // ==============================================================
    // Propose
    // ==============================================================

    // function propose(Propose memory _propose) external {
    //     if (_propose.marketMinStake < minStake) revert InvalidMinStake();
    //     if (_propose.amount < _propose.marketMinStake) revert InvalidAmount();

    //     if (bytes(_propose.metadataURI).length == 0) {
    //         if (_propose.refMarketId != 0) revert InvalidReferenceMarkedId();
    //         if (_propose.marketId >= s.marketId()) revert InvalidMarketId();
    //         if (!isMarket[_propose.marketId]) revert InvalidMarketType();
    //         _propose.claimExpiration = block.timestamp + minClaimDuration;
    //         _propose.stakingExpiration = _propose.claimExpiration;
    //         marketMinStake[_propose.marketId] *= (PRECISION + minStakeIncrease) / PRECISION;
    //     } else {
    //         if (
    //             _propose.claimExpiration < block.timestamp + minClaimDuration || _propose.stakingExpiration < _propose.claimExpiration
    //         ) revert InvalidExpiration();

    //         _propose.marketId = s.newMarketId();
    //         marketMinStake[_propose.marketId] = _propose.marketMinStake;
    //         _attachClaimMarket(_propose.marketId, _propose.refMarketId);
    //     }

    //     uint256 _claimId = s.claimsLength(_propose.marketId);
    //     if (_claimId >= maxClaims) revert MaxClaimsReached();
    //     if (_claimId > 0 && s.claims(_propose.marketId)[_claimId - 1].vote.disputeExpiration < block.timestamp) revert NotDisputePeriod();

    //     IStorage.Stake memory _stake;
    //     {
    //         address[] memory _stakers = new address[](1);
    //         _stakers[0] = msg.sender;
    //         if (_propose.yea) {
    //             _stake = IStorage.Stake({
    //                 yea: _propose.amount,
    //                 nay: 0,
    //                 expiration: _propose.stakingExpiration,
    //                 yeaStakers: _stakers,
    //                 nayStakers: new address[](0)
    //             });
    //         } else {
    //             _stake = IStorage.Stake({
    //                 yea: 0,
    //                 nay: _propose.amount,
    //                 expiration: _propose.stakingExpiration,
    //                 yeaStakers: new address[](0),
    //                 nayStakers: _stakers
    //             });
    //         }
    //     }

    //     IStorage.Claim memory _claim;
    //     {
    //         IStorage.Vote memory _vote;
    //         _claim = IStorage.Claim({
    //             metadataURI: _propose.metadataURI,
    //             expiration: _propose.claimExpiration,
    //             stake: _stake,
    //             vote: _vote,
    //             status: IStorage.ClaimStatus.Active
    //         });
    //     }

    //     s.createClaim(_claim, _propose.marketId, _claimId);
    //     s.incrementUserStake(_propose.amount, msg.sender, s.userClaimKey(msg.sender, _propose.marketId, _claimId));

    //     emit Proposed(_propose, msg.sender, _claimId);
    // }

    // struct Propose {
    //     string metadataURI;
    //     uint256 marketId;
    //     uint256 refMarketId;
    //     uint256 amount;
    //     uint256 marketMinStake;
    //     uint256 claimExpiration;
    //     uint256 stakingExpiration;
    //     bool yea;
    // }
    // uint256 public constant MAX_CLAIMS = 4;
    // uint256 public constant MIN_STAKE = 0.1 ether;
    // uint256 public constant MIN_CLAIM_DURATION = 1 weeks;
    // uint256 public constant VOTERS_LIMIT = 5;
    // uint256 public constant VOTING_DURATION = 3 days;
    // uint256 public constant DISPUTE_DURATION = 3 days;
    // uint256 public constant FEE = 1_000; // 10%
    function testPropose() public {
        IMarket.Propose memory _propose = IMarket.Propose(
            "metadataURI",
            0, // marketId
            0, // refMarketId
            MIN_STAKE, // 0.1 ether
            MIN_STAKE, // 0.1 ether
            block.timestamp + MIN_CLAIM_DURATION, // claimExpiration, 1 week
            block.timestamp + MIN_CLAIM_DURATION + claimMarket.MIN_STAKE_FREEZE_DURATION(), // stakingExpiration, 1 week + 1 day
            true // yea
        );
        vm.prank(alice);
        _router.propose{ value: MIN_STAKE }(_propose);

        // check isMarket
        // check claim data
        // check user stake
    }

    // function testProposeInvalidMinStake
    // function testProposeInvalidAmount
    // function testProposeInvalidExpiration
    // function testProposeMaxClaimsReached
    // function testProposeNotDisputePeriod
    // function testProposeNotNullifyMarket

    // function testProposeDispute
    // function testProposeDisputeInvalidReferenceMarkedId
    // function testProposeDisputeInvalidMarketId
    // function testProposeDisputeInvalidMarketType

    // ==============================================================
    // Stake
    // ==============================================================

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

    // ==============================================================
    // Dispute #2
    // ==============================================================

    // ==============================================================
    // Dispute #3
    // ==============================================================
}