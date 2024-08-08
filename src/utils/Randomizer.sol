// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {IMarkets, IRandomizer} from "./interfaces/IRandomizer.sol";

contract Randomizer is IRandomizer, Ownable2Step {

    uint256 public votersLimit;

    mapping(address => bool) public keepers;
    mapping(bytes32 userClaimKey => bool isUnique) public isUniqueVoter;

    IMarkets public immutable m;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _owner, address _markets) Ownable(_owner) {
        m = IMarkets(_markets);

        votersLimit = 5;
    }

    // ==============================================================
    // Modifiers
    // ==============================================================

    modifier onlyKeeper() {
        if (!keepers[msg.sender]) revert NotKeeper();
        _;
    }

    // ==============================================================
    // Keys
    // ==============================================================

    function userClaimKey(uint256 _marketId, uint256 _claimId, address _user) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_marketId, _claimId, _user));
    }

    // ==============================================================
    // Views
    // ==============================================================

    function triggerPrepareVote(uint256 _marketId) public view returns (bool) {

        uint256 _claimId = m.claimsLength(_marketId);
        if (_claimId == 0) return false;

        IMarkets.Claim memory _claim = m.claims(_marketId)[_claimId - 1];
        if (_claim.expiration <= block.timestamp && _claim.status == IMarkets.ClaimStatus.Active) return true;
        return false;
    }

    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId
    ) external onlyKeeper {

        uint256 _yeaLength = _yeaVoters.length;
        uint256 _nayLength = _nayVoters.length;
        if (_yeaLength == 0 && _nayLength == 0) revert ArrayLengthZero();
        if (_yeaLength > votersLimit) revert ArrayLengthExceedsLimit();

        uint256 _claimId = m.claimsLength(_marketId) - 1;
        if (_moreThanOneUser(_marketId, _claimId) && _yeaLength != _nayLength) revert ArrayLengthMismatch();

        if (_yeaLength > 0) _checkVoters(_yeaVoters, _marketId, _claimId);
        if (_nayLength > 0) _checkVoters(_nayVoters, _marketId, _claimId);

        m.prepareVote(_yeaVoters, _nayVoters, _marketId);
    }

    // ==============================================================
    // Owner
    // ==============================================================

    function setKeeper(address _keeper, bool _status) external onlyOwner {
        keepers[_keeper] = _status;
    }

    function setVotersLimit(uint256 _limit) external onlyOwner {
        if (_limit == 0) revert InvalidLimit();
        votersLimit = _limit;
    }

    // ==============================================================
    // Internal
    // ==============================================================

    // check voters are stakers and unique
    function _checkVoters(address[] calldata _voters, uint256 _marketId, uint256 _claimId) internal {
        bytes32 _claimKey = m.claimKey(_marketId, _claimId);
        uint256 _votersLength = _voters.length;
        for (uint256 i = 0; i < _votersLength; ++i) {
            uint256 _stakeAmount = m.userStake(_voters[i], _claimKey);
            if (_stakeAmount == 0) revert NotStaker();
            bytes32 _userClaimKey = userClaimKey(_marketId, _claimId, _voters[i]);
            if (isUniqueVoter[_userClaimKey]) revert NotUnique();
            isUniqueVoter[_userClaimKey] = true;
        }
    }

    function _moreThanOneUser(uint256 _marketId, uint256 _claimId) internal view returns (bool) {
        IMarkets.Stake memory _stake = m.claims(_marketId)[_claimId].stake;
        uint256 _yeaStakers = _stake.yeaStakers.length;
        uint256 _nayStakers = _stake.nayStakers.length;
        if (_yeaStakers > 1 && _nayStakers > 1) return true;
        return false;
    }
}