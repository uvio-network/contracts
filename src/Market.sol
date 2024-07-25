// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IStorageReader, IStorage} from "./interfaces/IStorageReader.sol";

// @todo - whitelist
contract Market is Ownable2Step {

    uint256 public maxClaims;
    uint256 public minStake;
    uint256 public minClaimDuration;
    uint256 public votersLimit;
    uint256 public votingDuration;
    uint256 public disputeDuration;
    uint256 public fee;

    mapping(bytes32 => bool) public isClaimed;

    IStorageReader public immutable s;

    uint256 public constant MAX_FEE = 1_000;
    uint256 public constant MIN_CLAIM_DURATION = 1 days;
    uint256 public constant MIN_VOTING_DURATION = 3 days;
    uint256 public constant MIN_DISPUTE_DURATION = 3 days;
    uint256 public constant PRECISION = 10_000;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(
        uint256 _maxClaims,
        uint256 _minStake,
        uint256 _minClaimDuration,
        uint256 _votersLimit,
        uint256 _votingDuration,
        uint256 _disputeDuration,
        uint256 _fee,
        address _storage,
        address _owner
    ) Ownable(_owner) {
        if (_maxClaims == 0) revert InvalidAmount();
        if (_minStake == 0) revert InvalidAmount();
        if (_minClaimDuration < MIN_CLAIM_DURATION) revert InvalidDuration();
        if (_votersLimit == 0) revert InvalidAmount();
        if (_votingDuration < MIN_VOTING_DURATION) revert InvalidDuration();
        if (_disputeDuration < MIN_DISPUTE_DURATION) revert InvalidDuration();
        if (_fee > MAX_FEE) revert InvalidFee();

        maxClaims = _maxClaims;
        minStake = _minStake;
        minClaimDuration = _minClaimDuration;
        votersLimit = _votersLimit;
        votingDuration = _votingDuration;
        disputeDuration = _disputeDuration;
        fee = _fee;

        s = IStorageReader(_storage);
    }

    // ==============================================================
    // Mutative
    // ==============================================================

    function propose(
        string calldata _ref,
        uint256 _marketId,
        uint256 _amount,
        uint256 _claimExpiration,
        uint256 _stakingExpiration,
        bool _yea
    ) external {
        if (_amount < minStake) revert InvalidAmount();

        if (bytes(_ref).length == 0) {
            if (_marketId >= s.marketId()) revert InvalidMarketId();
            _claimExpiration = block.timestamp + minClaimDuration;
            _stakingExpiration = _claimExpiration;
        } else {
            if (
                _claimExpiration < block.timestamp + minClaimDuration || _stakingExpiration < _claimExpiration
            ) revert InvalidExpiration();

            _marketId = s.newMarketId();
        }

        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length;
        if (_claimId >= maxClaims) revert MaxClaimsReached();
        if (_claimId > 0 && _claims[_claimId - 1].vote.disputeExpiration < block.timestamp) revert NotDisputePeriod();

        IStorage.Stake memory _stake;
        {
            address[] memory _stakers = new address[](1);
            _stakers[0] = msg.sender;
            if (_yea) {
                _stake = IStorage.Stake({
                    yea: _amount,
                    nay: 0,
                    expiration: _stakingExpiration,
                    yeaStakers: _stakers,
                    nayStakers: new address[](0)
                });
            } else {
                _stake = IStorage.Stake({
                    yea: 0,
                    nay: _amount,
                    expiration: _stakingExpiration,
                    yeaStakers: new address[](0),
                    nayStakers: _stakers
                });
            }
        }

        IStorage.Claim memory _claim;
        {
            IStorage.Vote memory _vote;
            _claim = IStorage.Claim({
                ref: _ref,
                expiration: _claimExpiration,
                stake: _stake,
                vote: _vote,
                status: IStorage.ClaimStatus.Active
            });
        }

        s.updateClaim(_claim, _marketId, _claimId);
        s.incrementUserStake(_amount, msg.sender, s.userStakeKey(msg.sender, _marketId, _claimId, _yea));

        emit Propose(msg.sender, _marketId, _claimId, _ref, _amount, _claimExpiration, _stakingExpiration, _yea);
    }

    function stake(uint256 _marketId, uint256 _amount, bool _yea) external {
        if (_amount < minStake) revert InvalidAmount();

        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        if (_claims[_claimId].stake.expiration < block.timestamp) revert NotStakingPeriod();

        bytes32 _userStakeKey = s.userStakeKey(msg.sender, _marketId, _claimId, _yea);
        s.incrementUserStake(_amount, msg.sender, _userStakeKey);
        s.incrementClaimStake(_amount, _marketId, _claimId, _yea);
        if (s.stakes(_userStakeKey) == 0) s.pushStaker(_marketId, _claimId, msg.sender, _yea);

        emit Stake(msg.sender, _marketId, _claimId, _amount, _yea);
    }

    // @todo - limit caller
    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId
    ) external {
        if (_yeaVoters.length != _nayVoters.length) revert NotEqualVoters();
        if (_yeaVoters.length == 0 || _yeaVoters.length > votersLimit) revert InvalidVoters();

        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        IStorage.Claim memory _claim = _claims[_claimId];
        if (_claim.expiration > block.timestamp) revert ClaimNotExpired();
        if (_claim.status != IStorage.ClaimStatus.Active) revert ClaimNotActive();

        // @todo - make sure (1) voters are unique (2) voters are stakers (use mappings)
        // uint256 _votersLength = _min(_min(_claim.stake.yeaStakers.length, _claim.stake.nayStakers.length), votersLimit);
        // address[] memory _yeaVoters = new address[](_votersLength);
        // address[] memory _nayVoters = new address[](_votersLength);
        // for (uint256 i = 0; i < _votersLength; ++i) { // @todo - randomize and make sure voter is not in both groups
        //     _yeaVoters[i] = _claim.stake.yeaStakers[i];
        //     _nayVoters[i] = _claim.stake.nayStakers[i];
        // }

        s.updateVoteExpiration(block.timestamp + votingDuration, _marketId, _claimId);
        s.updateVoters(_yeaVoters, _nayVoters, _marketId, _claimId);
        s.updateClaimStatus(IStorage.ClaimStatus.PendingVote, _marketId, _claimId);

        emit PrepareVote(_marketId);
    }

    function vote(uint256 _marketId, bool _yea, bool _yeaGroup) external {
        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        IStorage.Vote memory _vote = _claims[_claimId].vote;
        if (_vote.expiration < block.timestamp) revert NotVotingPeriod();

        bytes32 _userVoteKey = s.userVoteKey(msg.sender, _marketId, _claimId);
        if (s.votes(_userVoteKey) != IStorage.VoteStatus.None) revert AlreadyVoted();

        _yeaGroup ? _isVoter(msg.sender, _vote.yeaVoters) : _isVoter(msg.sender, _vote.nayVoters);

        IStorage.VoteStatus _voteStatus = _yea ? IStorage.VoteStatus.Yea : IStorage.VoteStatus.Nay;
        s.updateUserVoteStatus(_voteStatus, _userVoteKey);
        s.incrementVote(_yea, _marketId, _claimId);

        emit Vote(msg.sender, _marketId, _claimId, _yea, _yeaGroup);
    }

    function endVote(uint256 _marketId) external {
        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        if (_claims[_claimId].status != IStorage.ClaimStatus.PendingVote) revert NotPendingVote();

        IStorage.Vote memory _vote = _claims[_claimId].vote;
        if (_vote.expiration < block.timestamp) revert NotVotingPeriod();

        IStorage.Outcome _voteOutcome;
        if (_vote.yea > _vote.nay) {
            _voteOutcome = IStorage.Outcome.Yea;
        } else if (_vote.yea < _vote.nay) {
            _voteOutcome = IStorage.Outcome.Nay;
        } else {
            _voteOutcome = IStorage.Outcome.Tie;
        }

        s.updateVoteOutcome(_voteOutcome, _marketId, _claimId);
        s.updateDisputeExpiration(block.timestamp + disputeDuration, _marketId, _claimId);
        s.updateClaimStatus(IStorage.ClaimStatus.PendingResolution, _marketId, _claimId);

        emit EndVote(_marketId);
    }

    function resolve(uint256 _marketId) external {
        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        IStorage.Claim memory _lastClaim = _claims[_claimId];
        if (_lastClaim.status != IStorage.ClaimStatus.PendingResolution) revert NotPendingResolution();
        if (_lastClaim.vote.disputeExpiration > block.timestamp) revert DisputePeriodNotExpired();

        while (_claimId >= 0) {
            if (_lastClaim.vote.outcome == IStorage.Outcome.Yea) {
                s.updateClaimStatus(IStorage.ClaimStatus.ResolvedYea, _marketId, _claimId);
            } else if (_lastClaim.vote.outcome == IStorage.Outcome.Nay) {
                s.updateClaimStatus(IStorage.ClaimStatus.ResolvedNay, _marketId, _claimId);
            } else {
                s.updateClaimStatus(IStorage.ClaimStatus.PendingCommitteeResolution, _marketId, _claimId);
            }

            --_claimId;
        }

        emit Resolve(_marketId);
    }

    function committeeResolve(IStorage.Outcome _outcome, uint256 _marketId) external onlyOwner {
        IStorage.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimId = _claims.length - 1;
        IStorage.Claim memory _claim = _claims[_claimId];
        if (_claim.status != IStorage.ClaimStatus.PendingCommitteeResolution) revert NotPendingCommitteeResolution();

        while (_claimId >= 0) {
            if (_outcome == IStorage.Outcome.Yea) {
                s.updateClaimStatus(IStorage.ClaimStatus.ResolvedYea, _marketId, _claimId);
            } else if (_outcome == IStorage.Outcome.Nay) {
                s.updateClaimStatus(IStorage.ClaimStatus.ResolvedNay, _marketId, _claimId);
            } else {
                s.updateClaimStatus(IStorage.ClaimStatus.Nullified, _marketId, _claimId);
            }

            --_claimId;
        }

        emit CommitteeResolve(_marketId);
    }

    function claimProceeds(uint256 _marketId, uint256 _claimId, address _user, bool _yea) external {
        IStorage.Claim memory _claim = s.claims(_marketId)[_claimId];

        bytes32 _userStakeKey = s.userStakeKey(_user, _marketId, _claimId, _yea);
        if (isClaimed[_userStakeKey]) revert AlreadyClaimed();

        uint256 _stake = s.stakes(_userStakeKey);
        if (_stake == 0) revert NoStake();

        isClaimed[_userStakeKey] = true;

        uint256 _proceeds;
        if (_claim.status == IStorage.ClaimStatus.ResolvedYea && _yea) {
            _proceeds = _stake + (_stake * _claim.stake.nay / _claim.stake.yea);
        } else if (_claim.status == IStorage.ClaimStatus.ResolvedNay && !_yea) {
            _proceeds = _stake + (_stake * _claim.stake.yea / _claim.stake.nay);
        } else if (_claim.status == IStorage.ClaimStatus.Nullified) {
            _proceeds = _stake;
        } else {
            revert InvalidClaimStatus();
        }

        uint256 _fee = _proceeds * fee / PRECISION;
        _proceeds -= _fee;

        s.incerementUserBalance(_fee, owner());
        s.incerementUserBalance(_proceeds, _user);

        emit ClaimProceeds(_user, _proceeds, _fee, _marketId, _claimId);
    }

    // ==============================================================
    // Setters
    // ==============================================================

    function setMaxClaims(uint256 _maxClaims) external onlyOwner {
        if (_maxClaims == 0) revert InvalidAmount();
        maxClaims = _maxClaims;
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        if (_minStake == 0) revert InvalidAmount();
        minStake = _minStake;
    }

    function setMinClaimDuration(uint256 _minClaimDuration) external onlyOwner {
        if (_minClaimDuration < MIN_CLAIM_DURATION) revert InvalidDuration();
        minClaimDuration = _minClaimDuration;
    }

    function setVotersLimit(uint256 _votersLimit) external onlyOwner {
        if (_votersLimit == 0) revert InvalidAmount();
        votersLimit = _votersLimit;
    }

    function setVotingDuration(uint256 _votingDuration) external onlyOwner {
        if (_votingDuration < MIN_VOTING_DURATION) revert InvalidDuration();
        votingDuration = _votingDuration;
    }

    function setDisputeDuration(uint256 _disputeDuration) external onlyOwner {
        if (_disputeDuration < MIN_DISPUTE_DURATION) revert InvalidDuration();
        disputeDuration = _disputeDuration;
    }

    function setFee(uint256 _fee) external onlyOwner {
        if (_fee > MAX_FEE) revert InvalidFee();
        fee = _fee;
    }

    // ==============================================================
    // Helpers
    // ==============================================================

    function _isVoter(address _voter, address[] memory _voters) private pure {
        uint256 _len = _voters.length;
        for (uint256 i; i < _len; i++) {
            if (_voters[i] == _voter) return;
        }
        revert();
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    // ==============================================================
    // Events
    // ==============================================================

    event Propose(address indexed proposer, uint256 indexed marketId, uint256 indexed claimId, string ref, uint256 stake, uint256 claimExpiration, uint256 stakingExpiration, bool yea);
    event Stake(address indexed staker, uint256 indexed marketId, uint256 indexed claimId, uint256 stake, bool yea);
    event PrepareVote(uint256 indexed marketId);
    event Vote(address indexed voter, uint256 indexed marketId, uint256 indexed claimId, bool yea, bool yeaGroup);
    event EndVote(uint256 indexed marketId);
    event Resolve(uint256 indexed marketId);
    event CommitteeResolve(uint256 indexed marketId);
    event ClaimProceeds(address indexed user, uint256 proceeds, uint256 fee, uint256 marketId, uint256 claimId);

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
}