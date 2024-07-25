// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IStorage {

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
        // Abstain
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
        Outcome outcome;
    }

    struct Claim {
        string ref;
        uint256 expiration;
        Stake stake;
        Vote vote;
        ClaimStatus status;
    }

    function userStakeKey(address _user, uint256 _marketId, uint256 _claimId, bool _yea) external pure returns (bytes32);
    function userVoteKey(address _user, uint256 _marketId, uint256 _claimId) external pure returns (bytes32);
    function updateClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external;
    function incrementUserStake(uint256 _stake, address _user, bytes32 _userStakeKey) external;
    function incrementClaimStake(uint256 _stake, uint256 _marketId, uint256 _claimId, bool _yea) external;
    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external;
    function newMarketId() external returns (uint256);
    function updateVoteExpiration(uint256 _expiration, uint256 _marketId, uint256 _claimId) external;
    function updateVoters(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId, uint256 _claimId) external;
    function updateClaimStatus(ClaimStatus _status, uint256 _marketId, uint256 _claimId) external;
    function updateUserVoteStatus(VoteStatus _voteStatus, bytes32 _userVoteKey) external;
    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external;
    function updateVoteOutcome(Outcome _voteOutcome, uint256 _marketId, uint256 _claimId) external;
    function updateDisputeExpiration(uint256 _disputeExpiration, uint256 _marketId, uint256 _claimId) external;
    function incerementUserBalance(uint256 _amount, address _user) external;

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
    error NotMarket();
}