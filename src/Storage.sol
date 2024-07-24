// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IStorage} from "./interfaces/IStorage.sol";

contract Storage is IStorage {

    using SafeERC20 for IERC20;

    uint256 public marketId;

    mapping(address user => uint256 balance) public balances;
    mapping(address user => bool isWhitelisted) public whitelist;
    mapping(address user => bool isBlacklist) public blacklist;
    mapping(bytes32 userStakeKey => uint256 stake) public stakes; // user ==> marketId ==> claimId ==> yea
    mapping(bytes32 userVoteKey => VoteStatus vote) public votes; // user ==> marketId ==> claimId
    mapping(uint256 marketId => Claim[] claims) public claims;

    IERC20 public immutable asset;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _asset) {
        asset = IERC20(_asset);
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
    // View
    // ==============================================================

    // ==============================================================
    // Mutative - User
    // ==============================================================

    function deposit(uint256 _amount, address _reciever) external {
        if (!whitelist[_reciever]) revert NotWhitelisted();
        if (_amount == 0) revert ZeroAmount();

        balances[_reciever] += _amount;
        asset.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposit(msg.sender, _reciever, _amount);
    }

    function withdraw(uint256 _amount, address _reciever) external {
        if (balances[msg.sender] < _amount) revert InsufficientFunds();
        if (_amount == 0) revert ZeroAmount();

        balances[msg.sender] -= _amount;
        asset.safeTransfer(_reciever, _amount);

        emit Withdraw(msg.sender, _reciever, _amount);
    }

    // ==============================================================
    // Mutative - Market // @todo - onlyMarket
    // ==============================================================

    function updateClaim(Claim calldata _claim, uint256 _marketId, uint256 _claimId) external {
        claims[_marketId][_claimId] = _claim;
    }

    function updateStake(uint256 _stake, bytes32 _userStakeKey) external {
        stakes[_userStakeKey] = _stake;
    }

    function newMarketId() external returns (uint256) {
        return ++marketId;
    }

    // ==============================================================
    // Mutative - Admin
    // ==============================================================
    // function whitelist
    // function blacklist
    
}