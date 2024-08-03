// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IPriceProvider} from "./utils/interfaces/IPriceProvider.sol";

import {DataTypes} from "./utils/DataTypes.sol";

import {IStorage} from "./interfaces/IStorage.sol";
import {IMarket} from "./interfaces/IMarket.sol";

abstract contract BaseMarket is IMarket, Ownable2Step {

    uint256 public maxClaims;
    uint256 public minStake;
    uint256 public minStakeIncrease;
    uint256 public votersLimit;
    uint40 public minClaimDuration;
    uint40 public votingDuration;
    uint40 public disputeDuration;
    uint256 public fee;
    uint256 public proposerFee;

    address public randomizer;
    IPriceProvider public priceProvider;

    mapping(bytes32 userClaimKey => bool isClaim) public claimed;
    mapping(uint256 marketId => bool isMarket) public isMarket;
    mapping(uint256 marketId => uint256 minStake) public marketMinStake;

    IStorage public immutable s;

    uint40 public constant MIN_CLAIM_DURATION = 1 days;
    uint40 public constant MIN_STAKE_FREEZE_DURATION = 1 days;
    uint40 public constant MIN_VOTING_DURATION = 3 days;
    uint40 public constant MIN_DISPUTE_DURATION = 3 days;
    uint256 public constant MAX_FEE = 1_000;
    uint256 public constant PRECISION = 10_000;
    uint256 public constant PRICE_PRECISION = 1 ether;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(Initialize memory _init) Ownable(_init.owner) {
        if (_init.maxClaims >= IStorage(_init.storage_).MAX_CLAIMS()) revert InvalidAmount();
        if (_init.minStake == 0) revert InvalidAmount();
        if (_init.minStakeIncrease == 0) revert InvalidAmount();
        if (_init.votersLimit == 0) revert InvalidAmount();
        if (_init.minClaimDuration < MIN_CLAIM_DURATION) revert InvalidDuration();
        if (_init.votingDuration < MIN_VOTING_DURATION) revert InvalidDuration();
        if (_init.disputeDuration < MIN_DISPUTE_DURATION) revert InvalidDuration();
        if (_init.fee > MAX_FEE) revert InvalidFee();

        maxClaims = _init.maxClaims;
        minStake = _init.minStake;
        minStakeIncrease = _init.minStakeIncrease;
        votersLimit = _init.votersLimit;
        minClaimDuration = _init.minClaimDuration;
        votingDuration = _init.votingDuration;
        disputeDuration = _init.disputeDuration;
        fee = _init.fee;
        proposerFee = 0;

        randomizer = _init.randomizer;
        priceProvider = IPriceProvider(_init.priceProvider);

        s = IStorage(_init.storage_);
    }

    // ==============================================================
    // Keys
    // ==============================================================

    function userClaimKey(uint256 _marketId, uint256 _claimId, address _user) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_marketId, _claimId, _user));
    }

    // ==============================================================
    // Mutative
    // ==============================================================

    function propose(DataTypes.Propose memory _propose, uint256 _refMarketId) external {

        uint256 _minStake;
        if (bytes(_propose.metadataURI).length == 0) {
            if (_refMarketId != 0) revert InvalidReferenceMarkedId();
            if (_propose.marketId >= s.marketId()) revert InvalidMarketId();
            if (!isMarket[_propose.marketId]) revert InvalidMarketType();

            _minStake = marketMinStake[_propose.marketId] * (PRECISION + minStakeIncrease) / PRECISION;

            _propose.claimExpiration = uint40(block.timestamp) + minClaimDuration;
            _propose.stakingExpiration = _propose.claimExpiration;
        } else {
            if (_propose.price.steepness > 0 && !priceProvider.checkPriceParams(_propose.price)) revert InvalidPriceParams();
            if (
                _propose.claimExpiration < uint40(block.timestamp) + minClaimDuration ||
                _propose.stakingExpiration + MIN_STAKE_FREEZE_DURATION < _propose.claimExpiration
            ) revert InvalidExpiration();

            _minStake = minStake;

            _propose.marketId = s.newMarketId();
            isMarket[_propose.marketId] = true;
            _attachClaimMarket(_propose.marketId, _refMarketId);
        }

        if (_propose.amount < _minStake) revert InvalidAmount();
        marketMinStake[_propose.marketId] = _minStake;

        uint256 _claimId = s.claimsLength(_propose.marketId);
        if (_claimId >= maxClaims) revert MaxClaimsReached();

        if (_claimId > 0) {
            DataTypes.Claim memory _lastClaim = s.claims(_propose.marketId)[_claimId - 1];
            if (
                _lastClaim.vote.disputeExpiration < block.timestamp ||
                uint8(_lastClaim.status) >= uint8(DataTypes.ClaimStatus.Nullified)
            ) revert NotDisputePeriod();
        }

        s.createClaim(_propose, msg.sender);

        emit Proposed(_propose, msg.sender, _claimId);
    }

    function stake(uint256 _marketId, uint256 _amount, bool _yea) external returns (uint256) {
        if (_amount < marketMinStake[_marketId]) revert InvalidAmount();
        if (!isMarket[_marketId]) revert InvalidMarketType();

        uint256 _claimId = s.claimsLength(_marketId) - 1;
        DataTypes.Stake memory _stake = s.claims(_marketId)[_claimId].stake;

        uint256 _expiration = _stake.expiration;
        if (_expiration < block.timestamp) revert NotStakingPeriod();

        bytes32 _claimKey = s.claimKey(_marketId, _claimId);
        if (s.userStake(msg.sender, _claimKey) == 0) {
            s.pushStaker(_marketId, _claimId, msg.sender, _yea);
        } else {
            if (s.userStakeStatus(msg.sender, _claimKey) == DataTypes.VoteStatus.Yea && !_yea) revert InvalidStake();
            if (s.userStakeStatus(msg.sender, _claimKey) == DataTypes.VoteStatus.Nay && _yea) revert InvalidStake();
        }

        uint256 _timeWeightedAmount = _amount;
        if (_stake.price.steepness > 0 && _claimId == 0)
            _timeWeightedAmount =
                _timeWeightedAmount *
                priceProvider.getPrice(_stake.price, block.timestamp - _stake.start, _expiration - _stake.start) /
                PRICE_PRECISION;

        s.incrementUserStake(_amount, _timeWeightedAmount, msg.sender, _claimKey);
        s.incrementClaimStake(_timeWeightedAmount, _marketId, _claimId, _yea);

        emit Stake(msg.sender, _marketId, _claimId, _amount, _timeWeightedAmount, _yea);

        return _timeWeightedAmount;
    }

    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId
    ) external {
        if (msg.sender != randomizer) revert OnlyRandomizer();
        if (!isMarket[_marketId]) revert InvalidMarketType();

        uint256 _claimId = s.claimsLength(_marketId) - 1;
        DataTypes.Claim memory _claim = s.claims(_marketId)[_claimId];
        if (_claim.expiration > block.timestamp) revert ClaimNotExpired();
        if (_claim.status != DataTypes.ClaimStatus.Active) revert ClaimNotActive();

        s.setVoteExpiration(uint40(block.timestamp) + votingDuration, _marketId, _claimId);
        s.setVoters(_yeaVoters, _nayVoters, _marketId, _claimId);
        s.setClaimStatus(DataTypes.ClaimStatus.PendingVote, _marketId, _claimId);

        emit PrepareVote(_marketId);
    }

    function vote(uint256 _marketId, bool _yea, bool _yeaGroup) external {
        if (!isMarket[_marketId]) revert InvalidMarketType();

        uint256 _claimId = s.claimsLength(_marketId) - 1;
        DataTypes.Vote memory _vote = s.claims(_marketId)[_claimId].vote;
        if (_vote.expiration < block.timestamp) revert NotVotingPeriod();

        bytes32 _claimKey = s.claimKey(_marketId, _claimId);
        if (s.userVoteStatus(msg.sender, _claimKey) != DataTypes.VoteStatus.None) revert AlreadyVoted();

        _yeaGroup ? _isVoter(msg.sender, _vote.yeaVoters) : _isVoter(msg.sender, _vote.nayVoters);

        DataTypes.VoteStatus _voteStatus = _yea ? DataTypes.VoteStatus.Yea : DataTypes.VoteStatus.Nay;
        s.setUserVoteStatus(_voteStatus, msg.sender, _claimKey);
        s.incrementVote(_yea, _marketId, _claimId);
        if (_yeaGroup != _yea) s.shiftClaimStakes(s.userStake(msg.sender, _claimKey), _marketId, _claimId, _yeaGroup);

        emit Vote(msg.sender, _marketId, _claimId, _yea, _yeaGroup);
    }

    function endVote(uint256 _marketId) external {
        if (!isMarket[_marketId]) revert InvalidMarketType();

        uint256 _claimId = s.claimsLength(_marketId) - 1;
        DataTypes.Claim memory _claim = s.claims(_marketId)[_claimId];
        if (_claim.status != DataTypes.ClaimStatus.PendingVote) revert NotPendingVote();

        DataTypes.Vote memory _vote = _claim.vote;
        if (_vote.expiration > block.timestamp) revert VotePeriodNotExpired();

        uint256 _yeaVotes = _vote.yeaVoters.length + _vote.yea;
        uint256 _nayVotes = _vote.nayVoters.length + _vote.nay;

        DataTypes.Outcome _voteOutcome;
        if (_yeaVotes > _nayVotes) {
            _voteOutcome = DataTypes.Outcome.Yea;
        } else if (_yeaVotes < _nayVotes) {
            _voteOutcome = DataTypes.Outcome.Nay;
        } else {
            _voteOutcome = DataTypes.Outcome.Tie;
        }

        s.setVoteOutcome(_voteOutcome, _marketId, _claimId);
        s.setDisputeExpiration(uint40(block.timestamp) + disputeDuration, _marketId, _claimId);
        s.setClaimStatus(DataTypes.ClaimStatus.PendingResolution, _marketId, _claimId);

        emit EndVote(_marketId);
    }

    function resolve(uint256 _marketId) external {
        if (!isMarket[_marketId]) revert InvalidMarketType();

        bool isNullified_ = _isNullified(_marketId);
        uint256 _claimId = s.claimsLength(_marketId) - 1;
        DataTypes.Claim memory _lastClaim = s.claims(_marketId)[_claimId];
        if (_lastClaim.status != DataTypes.ClaimStatus.PendingResolution) revert NotPendingResolution();
        if (_lastClaim.vote.disputeExpiration > block.timestamp) revert DisputePeriodNotExpired();

        while (_claimId >= 0) {
            if (isNullified_) {
                s.setClaimStatus(DataTypes.ClaimStatus.Nullified, _marketId, _claimId);
            } else {
                if (_lastClaim.vote.outcome == DataTypes.Outcome.Yea) {
                    s.setClaimStatus(DataTypes.ClaimStatus.ResolvedYea, _marketId, _claimId);
                } else if (_lastClaim.vote.outcome == DataTypes.Outcome.Nay) {
                    s.setClaimStatus(DataTypes.ClaimStatus.ResolvedNay, _marketId, _claimId);
                } else {
                    s.setClaimStatus(DataTypes.ClaimStatus.PendingCommitteeResolution, _marketId, _claimId);
                }
            }

            --_claimId;
        }

        emit Resolve(_marketId);
    }

    function committeeResolve(DataTypes.Outcome _outcome, uint256 _marketId) external virtual onlyOwner {
        if (!isMarket[_marketId]) revert InvalidMarketType();

        uint256 _claimId = s.claimsLength(_marketId) - 1;
        if (
            s.claims(_marketId)[_claimId].status !=
            DataTypes.ClaimStatus.PendingCommitteeResolution
        ) revert NotPendingCommitteeResolution();

        while (_claimId >= 0) {
            if (_outcome == DataTypes.Outcome.Yea) {
                s.setClaimStatus(DataTypes.ClaimStatus.ResolvedYea, _marketId, _claimId);
            } else if (_outcome == DataTypes.Outcome.Nay) {
                s.setClaimStatus(DataTypes.ClaimStatus.ResolvedNay, _marketId, _claimId);
            } else {
                s.setClaimStatus(DataTypes.ClaimStatus.Nullified, _marketId, _claimId);
            }

            --_claimId;
        }

        emit CommitteeResolve(_marketId);
    }

    function claimProceedsMulti(uint256[] calldata _claimIds, uint256 _marketId, address _user) external {
        uint256 _len = _claimIds.length;
        for (uint256 i; i < _len; ++i) {
            claimProceeds(_marketId, _claimIds[i], _user);
        }
    }

    function claimProceeds(uint256 _marketId, uint256 _claimId, address _user) public {
        if (!isMarket[_marketId]) revert InvalidMarketType();

        DataTypes.Claim memory _claim = s.claims(_marketId)[_claimId];

        bytes32 _userClaimKey = userClaimKey(_marketId, _claimId, _user);
        if (claimed[_userClaimKey]) revert AlreadyClaimed();

        bytes32 _claimKey = s.claimKey(_marketId, _claimId);
        uint256 _stake = s.userStake(_user, _claimKey);
        if (_stake == 0) revert NoStake();

        claimed[_userClaimKey] = true;

        DataTypes.VoteStatus _userVoteStatus = s.userVoteStatus(_user, _claimKey);
        if (_userVoteStatus == DataTypes.VoteStatus.None) {
            _userVoteStatus = s.userStakeStatus(_user, _claimKey);
        }

        uint256 _fee;
        uint256 _earned;
        if (_claim.status == DataTypes.ClaimStatus.ResolvedYea && _userVoteStatus == DataTypes.VoteStatus.Yea) {
            _earned = _stake * _claim.stake.nay / _claim.stake.yea;
            _fee = _earned * fee / PRECISION;
        } else if (_claim.status == DataTypes.ClaimStatus.ResolvedNay && _userVoteStatus == DataTypes.VoteStatus.Nay) {
            _earned = _stake * _claim.stake.yea / _claim.stake.nay;
            _fee = _earned * fee / PRECISION;
        } else if (_claim.status == DataTypes.ClaimStatus.Nullified) {
            _earned = 0;
            _fee = _stake * fee / PRECISION;
        } else {
            revert InvalidClaimStatus();
        }

        {
            uint256 _feeToProposer;
            uint256 _proposerFee = proposerFee;
            if (_proposerFee > 0) {
                _feeToProposer = _fee * _proposerFee / PRECISION;
                s.incerementUserBalance(_feeToProposer, _claim.proposer);
            }
            s.incerementUserBalance(_fee - _feeToProposer, owner());
        }

        uint256 _proceeds = _stake + _earned - _fee;
        s.incerementUserBalance(_proceeds, _user);

        emit ClaimProceeds(_user, _proceeds, _fee, _earned, _marketId, _claimId);
    }

    // ==============================================================
    // Setters
    // ==============================================================

    function setMaxClaims(uint256 _maxClaims) external onlyOwner {
        if (_maxClaims >= s.MAX_CLAIMS()) revert InvalidAmount();
        maxClaims = _maxClaims;
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        if (_minStake == 0) revert InvalidAmount();
        minStake = _minStake;
    }

    function setMinStakeIncrease(uint256 _minStakeIncrease) external onlyOwner {
        minStakeIncrease = _minStakeIncrease;
    }

    function setMinClaimDuration(uint40 _minClaimDuration) external onlyOwner {
        if (_minClaimDuration < MIN_CLAIM_DURATION) revert InvalidDuration();
        minClaimDuration = _minClaimDuration;
    }

    function setVotersLimit(uint256 _votersLimit) external onlyOwner {
        if (_votersLimit == 0) revert InvalidAmount();
        votersLimit = _votersLimit;
    }

    function setVotingDuration(uint40 _votingDuration) external onlyOwner {
        if (_votingDuration < MIN_VOTING_DURATION) revert InvalidDuration();
        votingDuration = _votingDuration;
    }

    function setDisputeDuration(uint40 _disputeDuration) external onlyOwner {
        if (_disputeDuration < MIN_DISPUTE_DURATION) revert InvalidDuration();
        disputeDuration = _disputeDuration;
    }

    function setFee(uint256 _fee) external onlyOwner {
        if (_fee > MAX_FEE) revert InvalidFee();
        fee = _fee;
    }

    function setProposerFee(uint256 _proposerFee) external onlyOwner {
        if (_proposerFee > PRECISION) revert InvalidFee();
        proposerFee = _proposerFee;
    }

    function setRandomizer(address _randomizer) external onlyOwner {
        if (_randomizer == address(0)) revert InvalidAddress();
        randomizer = _randomizer;
    }

    function setPriceProvider(address _priceProvider) external onlyOwner {
        if (_priceProvider == address(0)) revert InvalidAddress();
        priceProvider = IPriceProvider(_priceProvider);
    }

    // ==============================================================
    // Helpers
    // ==============================================================

    function _isNullified(uint256 _marketId) virtual internal view returns (bool) {}

    function _attachClaimMarket(uint256 _marketId, uint256 _refMarketId) virtual internal {}

    function _isVoter(address _voter, address[] memory _voters) private pure {
        uint256 _len = _voters.length;
        for (uint256 i; i < _len; ++i) {
            if (_voters[i] == _voter) return;
        }
        revert NotVoter();
    }
}