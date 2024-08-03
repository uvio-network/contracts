// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

library DataTypes {

    enum ClaimStatus {
        None,
        Active,
        PendingVote,
        PendingResolution,
        PendingCommitteeResolution,
        Nullified,
        ResolvedYea,
        ResolvedNay
    }

    enum VoteStatus {
        None,
        Yea,
        Nay
    }

    enum Outcome {
        None,
        Yea,
        Nay,
        Tie
    }

    struct UserStatus {
        uint256 stakeAmount;
        VoteStatus stakeStatus;
        VoteStatus voteStatus;
    }

    struct User {
        uint256 balance;
        bool isWhitelisted;
        mapping(bytes32 claimKey => UserStatus) status;
    }

    struct Price {
        uint8 curveType;
        uint256 steepness;
    }

    struct Stake {
        uint256 yea;
        uint256 nay;
        uint40 expiration;
        uint40 start;
        address[] yeaStakers;
        address[] nayStakers;
        Price price;
    }

    struct Vote {
        uint256 yea;
        uint256 nay;
        uint40 expiration;
        uint40 disputeExpiration;
        address[] yeaVoters;
        address[] nayVoters;
        Outcome outcome;
    }

    struct Claim {
        string metadataURI;
        uint40 expiration;
        address proposer;
        Stake stake;
        Vote vote;
        ClaimStatus status;
    }

    struct Propose {
        string metadataURI;
        uint256 marketId;
        uint256 amount;
        uint40 claimExpiration;
        uint40 stakingExpiration;
        bool yea;
        DataTypes.Price price;
    }
}