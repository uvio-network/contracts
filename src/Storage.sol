// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IStorage} from "./interfaces/IStorage.sol";

contract Storage is IStorage, Ownable2Step {

    using SafeERC20 for IERC20;

    struct Markets {
        address marketV1;
        address marketV2;
    }
    Markets public market;

    uint256 public marketId;
    uint256 public totalAssets;

    bool public whitelistActive;

    mapping(address user => User userInfo) public users;
    mapping(uint256 marketId => Claim[] claims) public claims;

    IERC20 public immutable asset;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _asset, address _owner) Ownable(_owner) {
        asset = IERC20(_asset);

        whitelistActive = true;
    }

    // ==============================================================
    // Modifier
    // ==============================================================

    modifier onlyMarket() {
        if (msg.sender != market.marketV1 && msg.sender != market.marketV2) revert NotMarket();
        _;
    }

    // ==============================================================
    // View
    // ==============================================================

    function userStake(bytes32 _userClaimKey) external view returns (uint256) {
        return users[msg.sender].status[_userClaimKey].stakeAmount;
    }

    function userStakeStatus(bytes32 _userClaimKey) external view returns (VoteStatus) {
        return users[msg.sender].status[_userClaimKey].stakeStatus;
    }

    function userVoteStatus(bytes32 _userVoteKey) external view returns (VoteStatus) {
        return users[msg.sender].status[_userVoteKey].voteStatus;
    }

    function claimsLength(uint256 _marketId) external view returns (uint256) {
        return claims[_marketId].length;
    }

    // ==============================================================
    // Keys
    // ==============================================================

    function userClaimKey(address _user, uint256 _marketId, uint256 _claimId) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user, _marketId, _claimId));
    }

    // ==============================================================
    // Mutative - User
    // ==============================================================

    function deposit(uint256 _amount, address _reciever) external {
        if (whitelistActive && !users[_reciever].isWhitelisted) revert NotWhitelisted();
        if (_amount == 0) revert ZeroAmount();

        totalAssets += _amount;
        users[_reciever].balance += _amount;
        asset.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _reciever, _amount);
    }

    function withdraw(uint256 _amount, address _reciever) external {
        if (_amount == 0) revert ZeroAmount();

        totalAssets -= _amount;
        users[msg.sender].balance -= _amount;
        asset.safeTransfer(_reciever, _amount);

        emit Withdraw(msg.sender, _reciever, _amount);
    }

    // ==============================================================
    // Mutative - Market
    // ==============================================================

    // Balance

    function incerementUserBalance(uint256 _amount, address _user) external onlyMarket {
        if (asset.balanceOf(address(this)) < totalAssets + _amount) revert InsufficientFunds();
        users[_user].balance += _amount;
    }

    // Claim

    function newMarketId() external onlyMarket returns (uint256) {
        return ++marketId;
    }

    function createClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (claims[_marketId][_claimId].status != ClaimStatus.None) revert AlreadySet();
        claims[_marketId][_claimId] = _claim;
    }

    function setClaimStatus(ClaimStatus _status, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (uint8(claims[_marketId][_claimId].status) <= uint8(_status)) revert AlreadySet();
        claims[_marketId][_claimId].status = _status;
    }

    // Stake

    function incrementClaimStake(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _yea) external onlyMarket {
        _yea ? claims[_marketId][_claimId].stake.yea += _amount : claims[_marketId][_claimId].stake.nay += _amount;
    }

    function shiftClaimStakes(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _from) external onlyMarket {
        if (claims[_marketId][_claimId].status != ClaimStatus.PendingVote) revert InvalidStatus();
        if (_from) {
            claims[_marketId][_claimId].stake.yea -= _amount;
            claims[_marketId][_claimId].stake.nay += _amount;
        } else {
            claims[_marketId][_claimId].stake.nay -= _amount;
            claims[_marketId][_claimId].stake.yea += _amount;
        }
    }

    function incrementUserStake(uint256 _amount, address _user, bytes32 _userClaimKey) external onlyMarket {
        if (whitelistActive && !users[_user].isWhitelisted) revert NotWhitelisted();
        users[_user].balance -= _amount;
        users[_user].status[_userClaimKey].stakeAmount += _amount;
    }

    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external onlyMarket {
        bytes32 _userClaimKey = userClaimKey(_staker, _marketId, _claimId);
        if (users[_staker].status[_userClaimKey].stakeStatus != VoteStatus.None) revert AlreadySet();
        users[_staker].status[_userClaimKey].stakeStatus = _yea ? VoteStatus.Yea : VoteStatus.Nay;
        _yea ? claims[_marketId][_claimId].stake.yeaStakers.push(_staker) : claims[_marketId][_claimId].stake.nayStakers.push(_staker);
    }

    // Vote

    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external onlyMarket {
        _yea ? claims[_marketId][_claimId].vote.yea++ : claims[_marketId][_claimId].vote.nay++;
    }

    function setVoteExpiration(uint256 _expiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (claims[_marketId][_claimId].vote.expiration != 0) revert AlreadySet();
        claims[_marketId][_claimId].vote.expiration += _expiration;
    }

    function setDisputeExpiration(uint256 _disputeExpiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (claims[_marketId][_claimId].vote.disputeExpiration != 0) revert AlreadySet();
        claims[_marketId][_claimId].vote.disputeExpiration += _disputeExpiration;
    }

    function setVoteOutcome(Outcome _outcome, uint256 _marketId, uint256 _claimId) external onlyMarket {
        if (claims[_marketId][_claimId].vote.outcome != Outcome.None) revert AlreadySet();
        claims[_marketId][_claimId].vote.outcome = _outcome;
    }

    function setVoters(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId,
        uint256 _claimId
    ) external onlyMarket {
        if (
            claims[_marketId][_claimId].vote.yeaVoters.length != 0 ||
            claims[_marketId][_claimId].vote.nayVoters.length != 0
        ) revert AlreadySet();

        claims[_marketId][_claimId].vote.yeaVoters = _yeaVoters;
        claims[_marketId][_claimId].vote.nayVoters = _nayVoters;
    }

    function setUserVoteStatus(VoteStatus _voteStatus, address _user, bytes32 _userVoteKey) external onlyMarket {
        if (users[_user].status[_userVoteKey].voteStatus != VoteStatus.None) revert AlreadySet();
        users[_user].status[_userVoteKey].voteStatus = _voteStatus;
    }

    // ==============================================================
    // Mutative - Admin
    // ==============================================================

    function updateMarket(address _marketV1, address _marketV2) external onlyOwner {
        market.marketV1 = _marketV1;
        market.marketV2 = _marketV2;
    }

    function disableWhitelist() external onlyOwner {
        whitelistActive = false;
    }

    function whitelistUser(address _user) external onlyOwner {
        if (whitelistActive) revert WhitelistDisabled();
        users[_user].isWhitelisted = true;
    }
}