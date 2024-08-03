// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {DataTypes} from "../utils/DataTypes.sol";

interface IStorage {

    function claimKey(uint256 _marketId, uint256 _claimId) external pure returns (bytes32);
    function createClaim(DataTypes.Propose calldata _propose, address _proposer) external;
    function incrementUserStake(uint256 _amount, uint256 _timeWeightedAmount, address _user, bytes32 _claimKey) external;
    function incrementClaimStake(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _yea) external;
    function pushStaker(uint256 _marketId, uint256 _claimId, address _staker, bool _yea) external;
    function newMarketId() external returns (uint256);
    function setVoteExpiration(uint40 _expiration, uint256 _marketId, uint256 _claimId) external;
    function setVoters(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId, uint256 _claimId) external;
    function setClaimStatus(DataTypes.ClaimStatus _status, uint256 _marketId, uint256 _claimId) external;
    function setUserVoteStatus(DataTypes.VoteStatus _voteStatus, address _user, bytes32 _userVoteKey) external;
    function incrementVote(bool _yea, uint256 _marketId, uint256 _claimId) external;
    function setVoteOutcome(DataTypes.Outcome _voteOutcome, uint256 _marketId, uint256 _claimId) external;
    function setDisputeExpiration(uint40 _disputeExpiration, uint256 _marketId, uint256 _claimId) external;
    function incerementUserBalance(uint256 _amount, address _user) external;
    function userStake(address _user, bytes32 _claimKey) external view returns (uint256);
    function userStakeStatus(address _user, bytes32 _claimKey) external view returns (DataTypes.VoteStatus);
    function userVoteStatus(address _user, bytes32 _userVoteKey) external view returns (DataTypes.VoteStatus);
    function shiftClaimStakes(uint256 _amount, uint256 _marketId, uint256 _claimId, bool _from) external;
    function claimsLength(uint256 _marketId) external view returns (uint256);
    function setMarket(address market, bool _whitelist) external;
    function MAX_CLAIMS() external view returns (uint256);
    // function userBalance(address _user) external view returns (uint256);
    // mapping(address user => User userInfo) public users;
    function claims(uint256 _marketId) external view returns (DataTypes.Claim[10] memory);
    function marketId() external view returns (uint256);

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
    error MaxClaimsReached();
}