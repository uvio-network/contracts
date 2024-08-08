// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IPriceProvider} from "./utils/interfaces/IPriceProvider.sol";

import {IMarkets} from "./interfaces/IMarkets.sol";

contract Markets is IMarkets, Ownable2Step {

    using SafeERC20 for IERC20;

    uint256 public marketId;
    uint256 public minStake;
    uint256 public minStakeIncrease;
    uint256 public fee;
    uint256 public proposerFee;
    uint40 public minClaimDuration;
    uint40 public votingDuration;
    uint40 public disputeDuration;

    bool public isWhitelistActive;

    address public randomizer;
    IPriceProvider public priceProvider;

    mapping(address asset => bool) public assetWhitelist;
    mapping(uint256 marketId => uint256 length) public claimsLength;
    mapping(uint256 marketId => uint256 minStake) public marketMinStake;
    mapping(uint256 targetMarketId => uint256 nullifyMarketId) public nullifiedMarkets;

    uint256 public constant MAX_CLAIMS = 4;
    mapping(uint256 marketId => Claim[MAX_CLAIMS] claims) private _claims;
    mapping(address user => User userInfo) private _users;

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
        if (_init.minStake == 0) revert InvalidAmount();
        if (_init.minStakeIncrease == 0) revert InvalidAmount();
        if (_init.fee > MAX_FEE) revert InvalidFee();
        if (_init.minClaimDuration < MIN_CLAIM_DURATION) revert InvalidDuration();
        if (_init.votingDuration < MIN_VOTING_DURATION) revert InvalidDuration();
        if (_init.disputeDuration < MIN_DISPUTE_DURATION) revert InvalidDuration();

        minStake = _init.minStake;
        minStakeIncrease = _init.minStakeIncrease;
        fee = _init.fee;
        proposerFee = 0;
        minClaimDuration = _init.minClaimDuration;
        votingDuration = _init.votingDuration;
        disputeDuration = _init.disputeDuration;

        assetWhitelist[_init.asset] = true;

        randomizer = _init.randomizer;
        priceProvider = IPriceProvider(_init.priceProvider);

        isWhitelistActive = true;
        marketId = 1;
    }

    // ==============================================================
    // View
    // ==============================================================

    function userBalance(address _asset, address _user) external view returns (uint256) {
        return _users[_user].balance[_asset];
    }

    function userWhitelisted(address _user) external view returns (bool) {
        return _users[_user].isWhitelisted;
    }

    function userStake(address _user, bytes32 _claimKey) external view returns (uint256) {
        return _users[_user].status[_claimKey].stakeAmount;
    }

    function userClaimed(address _user, bytes32 _claimKey) external view returns (bool) {
        return _users[_user].status[_claimKey].isClaimed;
    }

    function userStakeStatus(address _user, bytes32 _claimKey) external view returns (VoteStatus) {
        return _users[_user].status[_claimKey].stakeStatus;
    }

    function userVoteStatus(address _user, bytes32 _userVoteKey) external view returns (VoteStatus) {
        return _users[_user].status[_userVoteKey].voteStatus;
    }

    function claims(uint256 _marketId) external view returns (Claim[MAX_CLAIMS] memory) {
        return _claims[_marketId];
    }

    // ==============================================================
    // Keys
    // ==============================================================

    function claimKey(uint256 _marketId, uint256 _claimId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_marketId, _claimId));
    }

    // ==============================================================
    // Mutative
    // ==============================================================

    function deposit(uint256 _amount, address _asset, address _reciever) external {
        if (isWhitelistActive && !_users[_reciever].isWhitelisted) revert UserNotWhitelisted();
        if (!assetWhitelist[_asset]) revert AssetNotWhitelisted();
        if (_reciever == address(0) || _reciever == address(this)) revert InvalidAddress();
        if (_amount == 0) revert ZeroAmount();

        _users[_reciever].balance[_asset] += _amount;
        IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _reciever, _amount);
    }

    function withdraw(uint256 _amount, address _asset, address _reciever) external {
        if (!assetWhitelist[_asset]) revert AssetNotWhitelisted();
        if (_reciever == address(0) || _reciever == address(this)) revert InvalidAddress();
        if (_amount == 0) revert ZeroAmount();

        _users[msg.sender].balance[_asset] -= _amount;
        IERC20(_asset).safeTransfer(_reciever, _amount);

        emit Withdraw(msg.sender, _reciever, _amount);
    }

    function propose(Propose memory _propose) external {

        uint256 _claimId;
        uint256 _minStake;
        if (_propose.dispute) {
            if (_propose.marketId >= marketId) revert InvalidMarketId();

            // Make sure unused params are not set
            if (_propose.nullifyMarketId != 0) revert InvalidNullifyMarketId();
            if (_propose.price.steepness != 0 || _propose.price.curveType != 0) revert InvalidPriceParams();
            if (_propose.claimExpiration != 0 || _propose.stakingExpiration != 0) revert InvalidExpiration();
            if (_propose.asset != address(0)) revert InvalidAddress();

            _claimId = claimsLength[_propose.marketId];
            if (_claimId > MAX_CLAIMS) revert MaxClaimsReached();

            Claim memory _lastClaim = _claims[_propose.marketId][_claimId - 1];
            if (
                _lastClaim.vote.disputeExpiration < block.timestamp ||
                uint8(_lastClaim.status) >= uint8(ClaimStatus.Nullified)
            ) revert NotDisputePeriod();

            _minStake = marketMinStake[_propose.marketId] * (PRECISION + minStakeIncrease) / PRECISION;

            _propose.asset = _lastClaim.asset;
            _propose.claimExpiration = uint40(block.timestamp) + minClaimDuration;
            _propose.stakingExpiration = _propose.claimExpiration;
        } else {
            if (!assetWhitelist[_propose.asset]) revert AssetNotWhitelisted();
            if (_propose.price.steepness > 0 && !priceProvider.checkPriceParams(_propose.price)) revert InvalidPriceParams();
            if (
                _propose.claimExpiration < uint40(block.timestamp) + minClaimDuration ||
                _propose.claimExpiration < _propose.stakingExpiration + MIN_STAKE_FREEZE_DURATION
            ) revert InvalidExpiration();

            _minStake = minStake;
            _propose.marketId = marketId++;

            if (_propose.nullifyMarketId > 0) {
                Claim memory _claim = _claims[_propose.nullifyMarketId][0];
                if (
                    uint8(_claim.status) >= uint8(ClaimStatus.Active) &&
                    uint8(_claim.status) <= uint8(ClaimStatus.PendingCommitteeResolution) &&
                    !_claim.isNullifyMarket &&
                    _propose.yea
                ) {
                    nullifiedMarkets[_propose.nullifyMarketId] = _propose.marketId;
                } else {
                    revert InvalidNullifyMarketId();
                }
            }
        }

        if (_propose.amount < _minStake) revert InvalidAmount();
        marketMinStake[_propose.marketId] = _minStake;

        _createClaim(_propose, _claimId, msg.sender);

        emit Proposed(_propose, _claimId);
    }

    function stake(uint256 _marketId, uint256 _amount, bool _yea) external returns (uint256) {
        if (_amount < marketMinStake[_marketId]) revert InvalidAmount();

        uint256 _claimId = claimsLength[_marketId] - 1;
        Claim memory _claim = _claims[_marketId][_claimId];
        if (_claim.stake.expiration < block.timestamp || _claim.status != ClaimStatus.Active) revert NotStakingPeriod();

        bytes32 _claimKey = claimKey(_marketId, _claimId);
        UserStatus memory _userStatus = _users[msg.sender].status[_claimKey];
        if (_userStatus.stakeAmount == 0) {
            _pushStaker(_marketId, _claimId, msg.sender, _yea, _claimKey);
        } else {
            if (
                _userStatus.stakeStatus == VoteStatus.Yea && !_yea ||
                _userStatus.stakeStatus == VoteStatus.Nay && _yea
            ) revert InvalidStake();
        }

        uint256 _timeWeightedAmount = _amount;
        if (_claimId == 0 && _claim.stake.price.steepness > 0)
            _timeWeightedAmount =
                _amount *
                priceProvider.getPrice(
                    _claim.stake.price,
                    block.timestamp - _claim.stake.start,
                    _claim.stake.expiration - _claim.stake.start
                ) /
                PRICE_PRECISION;

        _yea ?
            _claims[_marketId][_claimId].stake.yea += _timeWeightedAmount :
            _claims[_marketId][_claimId].stake.nay += _timeWeightedAmount;

        _incrementUserStake(_amount, _timeWeightedAmount, _claim.asset, msg.sender, _claimKey);

        emit Staked(msg.sender, _marketId, _claimId, _amount, _timeWeightedAmount, _yea);

        return _timeWeightedAmount;
    }

    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId
    ) external {
        if (msg.sender != randomizer) revert OnlyRandomizer();

        uint256 _claimId = claimsLength[_marketId] - 1;
        Claim memory claim_ = _claims[_marketId][_claimId];
        if (claim_.expiration > block.timestamp) revert ClaimNotExpired();
        if (claim_.status != ClaimStatus.Active) revert ClaimNotActive();

        Claim storage _claim = _claims[_marketId][_claimId];

        _claim.status = ClaimStatus.PendingVote;

        _claim.vote.expiration = uint40(block.timestamp) + votingDuration;
        _claim.vote.yeaVoters = _yeaVoters;
        _claim.vote.nayVoters = _nayVoters;

        emit PrepareVote(_marketId);
    }

    function vote(uint256 _marketId, bool _yea, bool _stake) external {

        uint256 _claimId = claimsLength[_marketId] - 1;
        Claim memory claim_ = _claims[_marketId][_claimId];
        if (
            claim_.vote.expiration < block.timestamp ||
            claim_.status != ClaimStatus.PendingVote
        ) revert NotVotingPeriod();

        _stake ? _isVoter(msg.sender, claim_.vote.yeaVoters) : _isVoter(msg.sender, claim_.vote.nayVoters);

        bytes32 _claimKey = claimKey(_marketId, _claimId);
        UserStatus memory user_ = _users[msg.sender].status[_claimKey];
        if (user_.voteStatus != VoteStatus.None) revert AlreadyVoted();

        UserStatus storage _user = _users[msg.sender].status[_claimKey];
        Claim storage _claim = _claims[_marketId][_claimId];
        if (_yea) {
            _user.voteStatus = VoteStatus.Yea;
            _claim.vote.yea++;
        } else {
            _user.voteStatus = VoteStatus.Nay;
            _claim.vote.nay++;
        }

        if (_stake != _yea) {
            uint256 _amount = user_.stakeAmount;
            if (_stake) {
                _claim.stake.yea -= _amount;
                _claim.stake.nay += _amount;
            } else {
                _claim.stake.nay -= _amount;
                _claim.stake.yea += _amount;
            }
        }

        emit Voted(msg.sender, _marketId, _claimId, _yea, _stake);
    }

    function endVote(uint256 _marketId) external {

        uint256 _claimId = claimsLength[_marketId] - 1;
        Claim memory claim_ = _claims[_marketId][_claimId];
        if (claim_.status != ClaimStatus.PendingVote) revert NotPendingVote();
        if (claim_.vote.expiration > block.timestamp) revert VotePeriodNotExpired();

        uint256 _yeaVotes = claim_.vote.yeaVoters.length + claim_.vote.yea;
        uint256 _nayVotes = claim_.vote.nayVoters.length + claim_.vote.nay;

        Outcome _outcome;
        if (_yeaVotes > _nayVotes) {
            _outcome = Outcome.Yea;
        } else if (_yeaVotes < _nayVotes) {
            _outcome = Outcome.Nay;
        } else {
            _outcome = Outcome.Tie;
        }

        Claim storage _claim = _claims[_marketId][_claimId];
        _claim.vote.outcome = _outcome;
        _claim.vote.disputeExpiration = uint40(block.timestamp) + disputeDuration;
        _claim.status = ClaimStatus.PendingResolution;

        emit EndVote(_marketId);
    }

    function resolve(uint256 _marketId) external {

        uint256 _claimId = claimsLength[_marketId] - 1;
        Claim memory _lastClaim = _claims[_marketId][_claimId];
        if (_lastClaim.vote.disputeExpiration > block.timestamp) revert DisputePeriodNotExpired();
        if (_lastClaim.status != ClaimStatus.PendingResolution) revert NotPendingResolution();

        bool _isNullified = false;
        uint256 _nullifyMarketId = nullifiedMarkets[_marketId];
        if (_nullifyMarketId != 0) {
            Claim storage _nullifyClaim = _claims[_nullifyMarketId][0];
            if (uint8(_nullifyClaim.status) < uint8(ClaimStatus.ResolvedYea)) revert NullifyMarketNotResolved();
            if (_nullifyClaim.vote.outcome == Outcome.Yea) {
                _isNullified = true;
            }
        }

        while(_claimId >= 0) {
            Claim storage _claim = _claims[_marketId][_claimId];
            if (_isNullified) {
                _claim.status = ClaimStatus.Nullified;
            } else {
                if (_lastClaim.vote.outcome == Outcome.Yea) {
                    _claim.status = ClaimStatus.ResolvedYea;
                } else if (_lastClaim.vote.outcome == Outcome.Nay) {
                    _claim.status = ClaimStatus.ResolvedNay;
                } else {
                    _claim.status = ClaimStatus.PendingCommitteeResolution;
                }
            }
            if (_claimId == 0) break;
            --_claimId;
        }

        emit Resolve(_marketId);
    }

    function committeeResolve(Outcome _outcome, uint256 _marketId) external onlyOwner {

        uint256 _claimId = claimsLength[_marketId] - 1;
        if (
            _claims[_marketId][_claimId].status !=
            ClaimStatus.PendingCommitteeResolution
        ) revert NotPendingCommitteeResolution();

        while (_claimId >= 0) {
            Claim storage _claim = _claims[_marketId][_claimId];
            if (_outcome == Outcome.Yea) {
                _claim.status = ClaimStatus.ResolvedYea;
            } else if (_outcome == Outcome.Nay) {
                _claim.status = ClaimStatus.ResolvedNay;
            } else {
                _claim.status = ClaimStatus.Nullified;
            }
            if (_claimId == 0) break;
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
        if (_user == address(0)) revert InvalidAddress();

        bytes32 _claimKey = claimKey(_marketId, _claimId);
        UserStatus memory _userStatus = _users[_user].status[_claimKey];
        if (_userStatus.isClaimed) revert AlreadyClaimed();
        if (_userStatus.stakeAmount == 0) revert NoStake();

        _users[_user].status[_claimKey].isClaimed = true;

        VoteStatus _userVoteStatus = _userStatus.voteStatus;
        if (_userVoteStatus == VoteStatus.None) _userVoteStatus = _userStatus.stakeStatus;

        Claim memory _claim = _claims[_marketId][_claimId];

        uint256 _fee;
        uint256 _earned;
        if (_claim.status == ClaimStatus.ResolvedYea && _userVoteStatus == VoteStatus.Yea) {
            _earned = _userStatus.stakeAmount * _claim.stake.nay / _claim.stake.yea;
            _fee = _earned * fee / PRECISION;
        } else if (_claim.status == ClaimStatus.ResolvedNay && _userVoteStatus == VoteStatus.Nay) {
            _earned = _userStatus.stakeAmount * _claim.stake.yea / _claim.stake.nay;
            _fee = _earned * fee / PRECISION;
        } else if (_claim.status == ClaimStatus.Nullified) {
            _earned = 0;
            _fee = _userStatus.stakeAmount * fee / PRECISION;
        } else {
            revert InvalidClaimStatus();
        }

        if (_fee > 0) {
            uint256 _feeToProposer;
            uint256 _proposerFee = proposerFee;
            if (_proposerFee > 0) {
                _feeToProposer = _fee * _proposerFee / PRECISION;
                _users[_claim.proposer].balance[_claim.asset] += _feeToProposer;
            }
            _users[owner()].balance[_claim.asset] += (_fee - _feeToProposer);
        }

        uint256 _proceeds = _userStatus.stakeAmount + _earned - _fee;
        _users[_user].balance[_claim.asset] += _proceeds;

        emit ClaimProceeds(_user, _proceeds, _fee, _earned, _marketId, _claimId);
    }

    // ==============================================================
    // Mutative - Owner
    // ==============================================================

    function disableWhitelist() external onlyOwner {
        isWhitelistActive = false;
    }

    function whitelistUser(address _user) external onlyOwner {
        if (!isWhitelistActive) revert WhitelistDisabled();
        _users[_user].isWhitelisted = true;
    }

    function whitelistAsset(address _asset) external onlyOwner {
        if (_asset == address(0)) revert InvalidAddress();
        assetWhitelist[_asset] = true;
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
    // Private
    // ==============================================================

    function _createClaim(Propose memory _propose, uint256 _claimId, address _proposer) private {
        Claim memory _claim;
        {
            Stake memory _stake;
            _propose.yea ? _stake.yea += _propose.amount : _stake.nay += _propose.amount;
            _stake.expiration = _propose.stakingExpiration;
            _stake.start = uint40(block.timestamp);
            _stake.price = _propose.price;

            Vote memory _vote;

            _claim = Claim({
                metadataURI: _propose.metadataURI,
                expiration: _propose.claimExpiration,
                proposer: _proposer,
                asset: _propose.asset,
                isNullifyMarket: _propose.nullifyMarketId != 0,
                stake: _stake,
                vote: _vote,
                status: ClaimStatus.Active
            });
        }

        _claims[_propose.marketId][_claimId] = _claim;
        claimsLength[_propose.marketId] = _claimId + 1;

        bytes32 _claimKey = claimKey(_propose.marketId, _claimId);
        _pushStaker(_propose.marketId, _claimId, _proposer, _propose.yea, _claimKey);
        _incrementUserStake(_propose.amount, _propose.amount, _propose.asset, _proposer, _claimKey);
    }

    function _incrementUserStake(uint256 _amount, uint256 _timeWeightedAmount, address _asset, address _user, bytes32 _claimKey) private {
        if (isWhitelistActive && !_users[_user].isWhitelisted) revert UserNotWhitelisted();
        _users[_user].balance[_asset] -= _amount;
        _users[_user].status[_claimKey].stakeAmount += _timeWeightedAmount;
    }

    function _pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea, bytes32 _claimKey) private {
        if (_yea) {
            _claims[_marketId][_claimId].stake.yeaStakers.push(_staker);
            _users[_staker].status[_claimKey].stakeStatus = VoteStatus.Yea;
        } else {
            _claims[_marketId][_claimId].stake.nayStakers.push(_staker);
            _users[_staker].status[_claimKey].stakeStatus = VoteStatus.Nay;
        }
    }

    function _isVoter(address _voter, address[] memory _voters) private pure {
        uint256 _len = _voters.length;
        for (uint256 i; i < _len; ++i) {
            if (_voters[i] == _voter) return;
        }
        revert NotVoter();
    }
}