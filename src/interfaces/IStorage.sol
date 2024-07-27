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
        mapping(bytes32 userClaimKey => UserStatus) status;
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

    function userClaimKey(address _user, uint256 _marketId, uint256 _claimId) external pure returns (bytes32);
    function createClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external;
    function incrementUserStake(uint256 _stake, address _user, bytes32 _userStakeKey) external;
    function incrementClaimStake(uint256 _stake, uint256 _marketId, uint256 _claimId, bool _yea) external;
    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external;
    function newMarketId() external returns (uint256);
    function setVoteExpiration(uint256 _expiration, uint256 _marketId, uint256 _claimId) external;
    function setVoters(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId, uint256 _claimId) external;
    function setClaimStatus(ClaimStatus _status, uint256 _marketId, uint256 _claimId) external;
    function setUserVoteStatus(VoteStatus _voteStatus, address _user, bytes32 _userVoteKey) external;
    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external;
    function setVoteOutcome(Outcome _voteOutcome, uint256 _marketId, uint256 _claimId) external;
    function setDisputeExpiration(uint256 _disputeExpiration, uint256 _marketId, uint256 _claimId) external;
    function incerementUserBalance(uint256 _amount, address _user) external;
    function userStake(bytes32 _userClaimKey) external view returns (uint256);
    function userStakeStatus(bytes32 _userClaimKey) external view returns (VoteStatus);
    function userVoteStatus(bytes32 _userVoteKey) external view returns (VoteStatus);
    function shiftClaimStakes(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _from) external;
    function claimsLength(uint256 _marketId) external view returns (uint256);

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
    error AlreadySet();
    error InsufficientFunds();
    error WhitelistDisabled();
    error InvalidStatus();
}