// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IStorage {

    enum ClaimStatus {
        None,
        Active,
        PendingResolution,
        Nullified,
        Resolved
    }

    enum VoteStatus {
        None,
        Yea,
        Nay,
        Abstain
    }

    enum Outcome {
        None,
        Yea,
        Nay,
        Tie
    }

    struct Stake {
        uint256 yea;
        uint256 nay;
        uint256 expiration;
        address[] yeaStakers;
        address[] nayStakers;
    }

    struct Vote {
        uint256 yea;
        uint256 nay;
        uint256 expiration;
        uint256 disputeExpiration;
        address[] yeaVoters;
        address[] nayVoters;
        Outcome voteOutcome;
        Outcome resolutionOutcome;
    }

    struct Claim {
        string ref;
        uint256 expiration;
        Stake stake;
        Vote vote;
        ClaimStatus status;
    }

    function userStakeKey(address _user, uint256 _marketId, uint256 _claimId, bool _yea) external pure returns (bytes32);
    function updateClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external;
    function updateStake(uint256 _stake, bytes32 _userStakeKey) external;
    function newMarketId() external returns (uint256);

    // ==============================================================
    // Events
    // ==============================================================

    event Deposit(address indexed sender, address indexed reciever, uint256 amount);
    event Withdraw(address indexed sender, address indexed reciever, uint256 amount);

    // ==============================================================
    // Errors
    // ==============================================================

    error NotWhitelisted();
    error ZeroAmount();
    error InsufficientFunds();
}