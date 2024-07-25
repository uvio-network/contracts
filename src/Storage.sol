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

    bool public whitelistActive;

    mapping(address user => uint256 balance) public balances;
    mapping(address user => bool isWhitelisted) public whitelist;
    mapping(bytes32 userStakeKey => uint256 stake) public stakes;
    mapping(bytes32 userVoteKey => VoteStatus vote) public votes;
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
    // Keys
    // ==============================================================

    function userStakeKey(address _user, uint256 _marketId, uint256 _claimId, bool _yea) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user, _marketId, _claimId, _yea));
    }

    function userVoteKey(address _user, uint256 _marketId, uint256 _claimId) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_user, _marketId, _claimId));
    }

    // ==============================================================
    // Mutative - User
    // ==============================================================

    function deposit(uint256 _amount, address _reciever) external {
        if (whitelistActive && !whitelist[_reciever]) revert NotWhitelisted();
        if (_amount == 0) revert ZeroAmount();

        balances[_reciever] += _amount;
        asset.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _reciever, _amount);
    }

    function withdraw(uint256 _amount, address _reciever) external {
        if (_amount == 0) revert ZeroAmount();

        balances[msg.sender] -= _amount;
        asset.safeTransfer(_reciever, _amount);

        emit Withdraw(msg.sender, _reciever, _amount);
    }

    // ==============================================================
    // Mutative - Market
    // ==============================================================

    // Balance

    function incerementUserBalance(uint256 _amount, address _user) external onlyMarket {
        balances[_user] += _amount;
    }

    // Claim

    function newMarketId() external onlyMarket returns (uint256) {
        return ++marketId;
    }

    function updateClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external onlyMarket {
        claims[_marketId][_claimId] = _claim;
    }

    function updateClaimStatus(ClaimStatus _status, uint256 _marketId, uint256 _claimId) external onlyMarket {
        claims[_marketId][_claimId].status = _status;
    }

    // Stake

    function incrementClaimStake(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _yea) external onlyMarket {
        _yea ? claims[_marketId][_claimId].stake.yea += _amount : claims[_marketId][_claimId].stake.nay += _amount;
    }

    function incrementUserStake(uint256 _amount, address _user, bytes32 _userStakeKey) external onlyMarket {
        balances[_user] -= _amount;
        stakes[_userStakeKey] += _amount;
    }

    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external onlyMarket {
        _yea ? claims[_marketId][_claimId].stake.yeaStakers.push(_staker) : claims[_marketId][_claimId].stake.nayStakers.push(_staker);
    }

    // Vote

    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external onlyMarket {
        _yea ? claims[_marketId][_claimId].vote.yea++ : claims[_marketId][_claimId].vote.nay++;
    }

    function updateVoteExpiration(uint256 _expiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        claims[_marketId][_claimId].vote.expiration = _expiration;
    }

    function updateDisputeExpiration(uint256 _disputeExpiration, uint256 _marketId, uint256 _claimId) external onlyMarket {
        claims[_marketId][_claimId].vote.disputeExpiration = _disputeExpiration;
    }

    function updateVoteOutcome(Outcome _outcome, uint256 _marketId, uint256 _claimId) external onlyMarket {
        claims[_marketId][_claimId].vote.outcome = _outcome;
    }

    function updateVoters(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId,
        uint256 _claimId
    ) external onlyMarket {
        claims[_marketId][_claimId].vote.yeaVoters = _yeaVoters;
        claims[_marketId][_claimId].vote.nayVoters = _nayVoters;
    }

    function updateUserVoteStatus(VoteStatus _voteStatus, bytes32 _userVoteKey) external onlyMarket {
        votes[_userVoteKey] = _voteStatus;
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
        whitelist[_user] = true;
    }
}