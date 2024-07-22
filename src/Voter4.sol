// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract Voter4 {

    enum ProposalType {
        Claim,
        Resolution,
        Dispute
    }

    function propose(ProposalType _type) public pure {
        if (_claim.status == ClaimStatus.None) {
            // propose a new claim. check if there's no active claim
            // _proposeClaim();
        } else if (_claim.expiration > block.timestamp) {
            // propose a resolution. check if there's an active claim/resolution/dispute
            // _proposeResolution();
        } else if (_type == ProposalType.Dispute) {
            // propose a dispute. check if there's an active claim/dispute
            // _proposeDispute();
        }
    }

    function vote(ProposalType _type) public pure {
        if (_type == ProposalType.Claim) {
            // vote on claim. only
            // _voteClaim();
        } else if (_type == ProposalType.Resolution) {
            // propose a resolution. check if there's an active claim/resolution/dispute
            // _voteResolution();
        } else if (_type == ProposalType.Dispute) {
            // propose a dispute. check if there's an active claim/dispute
            // _voteDispute();
        }
    }

    // function resolve
}