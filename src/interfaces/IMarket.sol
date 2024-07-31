// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IMarket {
    struct Initialize {
        uint256 maxClaims;
        uint256 minStake;
        uint256 minStakeIncrease;
        uint256 minClaimDuration;
        uint256 votersLimit;
        uint256 votingDuration;
        uint256 disputeDuration;
        uint256 fee;
        address storage_;
        address owner;
        address randomizer;
    }

    struct Propose {
        string metadataURI;
        uint256 marketId;
        uint256 refMarketId;
        uint256 amount;
        uint256 marketMinStake;
        uint256 claimExpiration;
        uint256 stakingExpiration;
        bool yea;
    }
    function propose(Propose memory _propose) external;
    function prepareVote(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId) external;
    function votersLimit() external view returns (uint256);
    function isMarket(uint256 _marketId) external view returns (bool);
    function userClaimKey(uint256 _marketId, uint256 _claimId, address _user) external pure returns (bytes32);

    // ==============================================================
    // Events
    // ==============================================================

    event Proposed(Propose propose, address indexed proposer, uint256 indexed claimId);
    event Stake(address indexed staker, uint256 indexed marketId, uint256 indexed claimId, uint256 stake, bool yea);
    event PrepareVote(uint256 indexed marketId);
    event Vote(address indexed voter, uint256 indexed marketId, uint256 indexed claimId, bool yea, bool yeaGroup);
    event EndVote(uint256 indexed marketId);
    event Resolve(uint256 indexed marketId);
    event CommitteeResolve(uint256 indexed marketId);
    event ClaimProceeds(address indexed user, uint256 proceeds, uint256 fee, uint256 earned, uint256 marketId, uint256 claimId);

    // ==============================================================
    // Errors
    // ==============================================================

    error InvalidAmount();
    error InvalidDuration();
    error InvalidFee();
    error InvalidMarketId();
    error InvalidExpiration();
    error MaxClaimsReached();
    error NotDisputePeriod();
    error NotStakingPeriod();
    error ClaimNotExpired();
    error ClaimNotActive();
    error NotVotingPeriod();
    error AlreadyVoted();
    error NotPendingVote();
    error NotPendingResolution();
    error DisputePeriodNotExpired();
    error NotPendingCommitteeResolution();
    error InvalidClaimStatus();
    error AlreadyClaimed();
    error NoStake();
    error NotEqualVoters();
    error InvalidVoters();
    error OnlyRandomizer();
    error InvalidStake();
    error InvalidMinStake();
    error InvalidAddress();
    error InvalidReferenceMarkedId();
    error InvalidMarketType();
    error NotVoter();
}