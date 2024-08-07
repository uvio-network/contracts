// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "../Base.sol";

contract FirstDisputeTest is Base {

    function setUp() public override {
        Base.setUp();
    }

    // ==============================================================
    // Tests
    // ==============================================================

    function testSanity() public {
        assertTrue(true);
    }

    // ==============================================================
    // Tests
    // ==============================================================

    function _propose(uint256 _amount) internal {
        vm.assume(_amount >= MIN_STAKE && _amount <= 100 ether);

        _deposit(alice, _amount);
    }

    // function _stake

    // // prepareVote
    //     {
    //         uint256 _expiration = m.claims(marketId)[_claimId].expiration;
    //         skip(_expiration - block.timestamp);
    //         address[] memory _yeaVoters = new address[](1);
    //         _yeaVoters[0] = alice;
    //         address[] memory _nayVoters = new address[](1);
    //         _nayVoters[0] = bob;
    //         randomizer.prepareVote(_yeaVoters, _nayVoters, marketId);
    //     }

    //     // vote -- only alice votes. bob and yossi don't vote
    //     {
    //         vm.prank(alice);
    //         m.vote(marketId, true, true); // alice votes for her stake
    //     }

    //     // endVote
    //     {
    //         uint256 _expiration = m.claims(marketId)[_claimId].vote.expiration;
    //         skip(_expiration - block.timestamp);
    //         m.endVote(marketId);
    //     }

    //     // resolve
    //     {
    //         uint256 _expiration = m.claims(marketId)[_claimId].vote.disputeExpiration;
    //         skip(_expiration - block.timestamp);
    //         m.resolve(marketId);
    //         assertEq(uint8(m.claims(marketId)[_claimId].status), uint8(IMarkets.ClaimStatus.ResolvedYea), "testClaimProceedsNoVoteStatus: E0");
    //     }
}