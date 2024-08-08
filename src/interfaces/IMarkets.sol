// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IPriceProvider} from "../utils/interfaces/IPriceProvider.sol";

interface IMarkets {

    // ==============================================================
    // Data types
    // ==============================================================

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
        bool isClaimed;
        VoteStatus stakeStatus;
        VoteStatus voteStatus;
    }

    struct User {
        bool isWhitelisted;
        mapping(address asset => uint256 balance) balance;
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
        address asset;
        bool isNullifyMarket;
        Stake stake;
        Vote vote;
        ClaimStatus status;
    }

    struct Propose {
        string metadataURI;
        uint256 marketId;
        uint256 nullifyMarketId;
        uint256 amount;
        address asset;
        uint40 claimExpiration;
        uint40 stakingExpiration;
        bool yea;
        bool dispute;
        Price price;
    }

    struct Initialize {
        uint256 minStake;
        uint256 minStakeIncrease;
        uint256 fee;
        uint40 minClaimDuration;
        uint40 votingDuration;
        uint40 disputeDuration;
        address owner;
        address asset;
        address randomizer;
        address priceProvider;
    }

    // ==============================================================
    // State variables
    // ==============================================================

    function minStake() external view returns (uint256);
    function minStakeIncrease() external view returns (uint256);
    function fee() external view returns (uint256);
    function proposerFee() external view returns (uint256);
    function marketId() external view returns (uint256);
    function minClaimDuration() external view returns (uint40);
    function votingDuration() external view returns (uint40);
    function disputeDuration() external view returns (uint40);
    function isWhitelistActive() external view returns (bool);
    function randomizer() external view returns (address);
    function priceProvider() external view returns (IPriceProvider);
    function assetWhitelist(address) external view returns (bool);
    function claimsLength(uint256 _marketId) external view returns (uint256);
    function marketMinStake(uint256 _marketId) external view returns (uint256);
    function nullifiedMarkets(uint256 _targetMarketId) external view returns (uint256);
    function MAX_CLAIMS() external view returns (uint256);
    function MIN_CLAIM_DURATION() external view returns (uint40);
    function MIN_STAKE_FREEZE_DURATION() external view returns (uint40);
    function MIN_VOTING_DURATION() external view returns (uint40);
    function MIN_DISPUTE_DURATION() external view returns (uint40);
    function MAX_FEE() external view returns (uint256);
    function PRECISION() external view returns (uint256);
    function PRICE_PRECISION() external view returns (uint256);

    // ==============================================================
    // View
    // ==============================================================

    function userBalance(address _asset, address _user) external view returns (uint256);
    function userWhitelisted(address _user) external view returns (bool);
    function userStake(address _user, bytes32 _claimKey) external view returns (uint256);
    function userClaimed(address _user, bytes32 _claimKey) external view returns (bool);
    function userStakeStatus(address _user, bytes32 _claimKey) external view returns (VoteStatus);
    function userVoteStatus(address _user, bytes32 _userVoteKey) external view returns (VoteStatus);
    function claims(uint256 _marketId) external view returns (Claim[4] memory);

    // ==============================================================
    // Keys
    // ==============================================================

    function claimKey(uint256 _marketId, uint256 _claimId) external pure returns (bytes32);

    // ==============================================================
    // Mutative
    // ==============================================================

    function deposit(uint256 _amount, address _asset, address _reciever) external;
    function withdraw(uint256 _amount, address _asset, address _reciever) external;
    function propose(Propose memory _propose) external;
    function stake(uint256 _marketId, uint256 _amount, bool _yea) external returns (uint256);
    function prepareVote(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId) external;
    function vote(uint256 _marketId, bool _yea, bool _stake) external;
    function endVote(uint256 _marketId) external;
    function resolve(uint256 _marketId) external;
    function committeeResolve(Outcome _outcome, uint256 _marketId) external;
    function claimProceedsMulti(uint256[] calldata _claimIds, uint256 _marketId, address _user) external;
    function claimProceeds(uint256 _marketId, uint256 _claimId, address _user) external;

    // ==============================================================
    // Mutative - Admin
    // ==============================================================

    function disableWhitelist() external;
    function whitelistUser(address _user) external;
    function whitelistAsset(address _asset) external;
    function setMinStake(uint256 _minStake) external;
    function setMinStakeIncrease(uint256 _minStakeIncrease) external;
    function setMinClaimDuration(uint40 _minClaimDuration) external;
    function setVotingDuration(uint40 _votingDuration) external;
    function setDisputeDuration(uint40 _disputeDuration) external;
    function setFee(uint256 _fee) external;
    function setProposerFee(uint256 _proposerFee) external;
    function setRandomizer(address _randomizer) external;
    function setPriceProvider(address _priceProvider) external;

    // ==============================================================
    // Events
    // ==============================================================

    event Deposit(address indexed sender, address indexed reciever, uint256 amount);
    event Withdraw(address indexed sender, address indexed reciever, uint256 amount);
    event Proposed(Propose propose, uint256 claimId);
    event Staked(address indexed staker, uint256 marketId, uint256 claimId, uint256 amount, uint256 timeWeightedAmount, bool yea);
    event PrepareVote(uint256 marketId);
    event Voted(address indexed voter, uint256 marketId, uint256 claimId, bool yea, bool stake);
    event EndVote(uint256 marketId);
    event Resolve(uint256 marketId);
    event CommitteeResolve(uint256 marketId);
    event ClaimProceeds(address indexed user, uint256 proceeds, uint256 fee, uint256 earned, uint256 marketId, uint256 claimId);

    // ==============================================================
    // Errors
    // ==============================================================

    error InvalidFee();
    error InvalidDuration();
    error UserNotWhitelisted();
    error ZeroAmount();
    error AssetNotWhitelisted();
    error InvalidMarketId();
    error InvalidNullifyMarketId();
    error InvalidPriceParams();
    error MaxClaimsReached();
    error NotDisputePeriod();
    error InvalidAmount();
    error NotStakingPeriod();
    error InvalidStake();
    error ClaimNotExpired();
    error ClaimNotActive();
    error NotVotingPeriod();
    error AlreadyVoted();
    error VotePeriodNotExpired();
    error DisputePeriodNotExpired();
    error NotPendingVote();
    error NotPendingResolution();
    error NullifyMarketNotResolved();
    error NotPendingCommitteeResolution();
    error WhitelistDisabled();
    error NoStake();
    error InvalidClaimStatus();
    error InvalidExpiration();
    error NotVoter();
    error AlreadyClaimed();
    error OnlyRandomizer();
    error InvalidAddress();
}