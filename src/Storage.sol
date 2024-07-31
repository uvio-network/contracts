// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IStorage} from "./interfaces/IStorage.sol";

contract Storage is IStorage, Ownable2Step {

    using SafeERC20 for IERC20;

    uint256 public marketId;
    uint256 public totalAssets;

    bool public whitelistActive;

    mapping(address market => bool whitelisted) public markets;
    mapping(uint256 marketId => uint256 length) public claimsLength;

    uint256 public constant MAX_CLAIMS = 10;
    mapping(uint256 marketId => Claim[MAX_CLAIMS] claims) private _claims;
    mapping(address user => User userInfo) private _users;

    IERC20 public immutable asset;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _owner, address _asset) Ownable(_owner) {
        asset = IERC20(_asset);

        whitelistActive = true;
    }

    // ==============================================================
    // Modifier
    // ==============================================================

    modifier onlyMarket() {
        if (!markets[msg.sender]) revert NotMarket();
        _;
    }

    // ==============================================================
    // View
    // ==============================================================

    function userBalance(address _user) external view returns (uint256) {
        return _users[_user].balance;
    }

    function userStake(address _user, bytes32 _claimKey) external view returns (uint256) {
        return _users[_user].status[_claimKey].stakeAmount;
    }

    function userIsWhitelisted(address _user) external view returns (bool) {
        return _users[_user].isWhitelisted;
    }

    function userStakeStatus(address _user, bytes32 _claimKey) external view returns (VoteStatus) {
        return _users[_user].status[_claimKey].stakeStatus;
    }

    function userVoteStatus(address _user, bytes32 _userVoteKey) external view returns (VoteStatus) {
        return _users[_user].status[_userVoteKey].voteStatus;
    }

    function claims(uint256 _marketId) external view returns (Claim[10] memory) {
        return _claims[_marketId];
    }

    // ==============================================================
    // Keys
    // ==============================================================

    function claimKey(uint256 _marketId, uint256 _claimId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_marketId, _claimId));
    }

    // ==============================================================
    // Mutative - User
    // ==============================================================

    function deposit(uint256 _amount, address _reciever) external {
        if (whitelistActive && !_users[_reciever].isWhitelisted) revert NotWhitelisted();
        if (_amount == 0) revert ZeroAmount();

        totalAssets += _amount;
        _users[_reciever].balance += _amount;
        asset.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _reciever, _amount);
    }

    function withdraw(uint256 _amount, address _reciever) external {
        if (_amount == 0) revert ZeroAmount();

        totalAssets -= _amount;
        _users[msg.sender].balance -= _amount;
        asset.safeTransfer(_reciever, _amount);

        emit Withdraw(msg.sender, _reciever, _amount);
    }

    // ==============================================================
    // Mutative - Market
    // ==============================================================

    // Balance

    function incerementUserBalance(uint256 _amount, address _user) external onlyMarket {
        if (asset.balanceOf(address(this)) < totalAssets + _amount) revert InsufficientFunds();
        _users[_user].balance += _amount;
    }

    // Claim

    function newMarketId() external onlyMarket returns (uint256) {
        return marketId++;
    }

    function createClaim(Claim calldata _claim, uint256 _marketId) external onlyMarket {
        uint256 _length = claimsLength[_marketId];
        if (_length >= MAX_CLAIMS - 1) revert MaxClaimsReached();
        if (_claims[_marketId][_length].status != ClaimStatus.None) revert AlreadySet();

        _claims[_marketId][_length] = _claim;
        claimsLength[_marketId] = _length + 1;
    }

    function setClaimStatus(ClaimStatus _status, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (uint8(_claims[_marketId][_claimId].status) <= uint8(_status)) revert AlreadySet();
        _claims[_marketId][_claimId].status = _status;
    }

    // Stake

    function incrementClaimStake(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _yea) external onlyMarket {
        _yea ? _claims[_marketId][_claimId].stake.yea += _amount : _claims[_marketId][_claimId].stake.nay += _amount;
    }

    function shiftClaimStakes(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _from) external onlyMarket {
        if (_claims[_marketId][_claimId].status != ClaimStatus.PendingVote) revert InvalidStatus();
        if (_from) {
            _claims[_marketId][_claimId].stake.yea -= _amount;
            _claims[_marketId][_claimId].stake.nay += _amount;
        } else {
            _claims[_marketId][_claimId].stake.nay -= _amount;
            _claims[_marketId][_claimId].stake.yea += _amount;
        }
    }

    function incrementUserStake(uint256 _amount, uint256 _timeWeightedAmount, address _user, bytes32 _claimKey) external onlyMarket {
        if (whitelistActive && !_users[_user].isWhitelisted) revert NotWhitelisted();
        _users[_user].balance -= _amount;
        _users[_user].status[_claimKey].stakeAmount += _timeWeightedAmount;
    }

    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external onlyMarket {
        bytes32 _claimKey = claimKey(_marketId, _claimId);
        if (_users[_staker].status[_claimKey].stakeStatus != VoteStatus.None) revert AlreadySet();
        _users[_staker].status[_claimKey].stakeStatus = _yea ? VoteStatus.Yea : VoteStatus.Nay;
        _yea ? _claims[_marketId][_claimId].stake.yeaStakers.push(_staker) : _claims[_marketId][_claimId].stake.nayStakers.push(_staker);
    }

    // Vote

    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external onlyMarket {
        _yea ? _claims[_marketId][_claimId].vote.yea++ : _claims[_marketId][_claimId].vote.nay++;
    }

    function setVoteExpiration(uint256 _expiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (_claims[_marketId][_claimId].vote.expiration != 0) revert AlreadySet();
        _claims[_marketId][_claimId].vote.expiration += _expiration;
    }

    function setDisputeExpiration(uint256 _disputeExpiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (_claims[_marketId][_claimId].vote.disputeExpiration != 0) revert AlreadySet();
        _claims[_marketId][_claimId].vote.disputeExpiration += _disputeExpiration;
    }

    function setVoteOutcome(Outcome _outcome, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (_claims[_marketId][_claimId].vote.outcome != Outcome.None) revert AlreadySet();
        _claims[_marketId][_claimId].vote.outcome = _outcome;
    }

    function setVoters(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId,
        uint256 _claimId
    ) external onlyMarket {
        if (
            _claims[_marketId][_claimId].vote.yeaVoters.length != 0 ||
            _claims[_marketId][_claimId].vote.nayVoters.length != 0
        ) revert AlreadySet();

        _claims[_marketId][_claimId].vote.yeaVoters = _yeaVoters;
        _claims[_marketId][_claimId].vote.nayVoters = _nayVoters;
    }

    function setUserVoteStatus(VoteStatus _voteStatus, address _user, bytes32 _userVoteKey) external onlyMarket {
        if (_users[_user].status[_userVoteKey].voteStatus != VoteStatus.None) revert AlreadySet();
        _users[_user].status[_userVoteKey].voteStatus = _voteStatus;
    }

    // ==============================================================
    // Mutative - Admin
    // ==============================================================

    function setMarket(address market, bool _whitelist) external onlyOwner {
        markets[market] = _whitelist;
    }

    function disableWhitelist() external onlyOwner {
        whitelistActive = false;
    }

    function whitelistUser(address _user) external onlyOwner {
        if (!whitelistActive) revert WhitelistDisabled();
        _users[_user].isWhitelisted = true;
    }
}