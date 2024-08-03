// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";

import {DataTypes} from "./DataTypes.sol";

import {IMarket, IRandomizer, IStorage} from "./interfaces/IRandomizer.sol";

contract Randomizer is IRandomizer, Ownable2Step {

    mapping(bytes32 userClaimKey => bool isUnique) public isUniqueVoter;
    
    IStorage public immutable s;
    IMarket public immutable claimMarket;
    IMarket public immutable nullifyMarket;

    mapping(address => bool) public keepers;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _owner, address _storage, address _claimMarket, address _nullifyMarket) Ownable(_owner) {
        s = IStorage(_storage);
        claimMarket = IMarket(_claimMarket);
        nullifyMarket = IMarket(_nullifyMarket);
    }

    // ==============================================================
    // Modifiers
    // ==============================================================

    modifier onlyKeeper() {
        if (!keepers[msg.sender]) revert NotKeeper();
        _;
    }

    // ==============================================================
    // Views
    // ==============================================================

    function triggerPrepareVote(uint256 _marketId) public view returns (bool) {
        uint256 _claimId = s.claimsLength(_marketId) - 1;
        if (_claimId == 0) return false;
        DataTypes.Claim memory _claim = s.claims(_marketId)[_claimId];
        if (_claim.expiration <= block.timestamp && _claim.status == DataTypes.ClaimStatus.Active) return true;
        return false;
    }

    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId,
        bool _isClaimMarket
    ) external {
        IMarket _market = _isClaimMarket ? claimMarket : nullifyMarket;

        uint256 _yeaLength = _yeaVoters.length;
        uint256 _nayLength = _nayVoters.length;
        if (_yeaLength != _nayLength) revert ArrayLengthMismatch();
        if (_yeaLength == 0 && _nayLength == 0) revert ArrayLengthZero();
        if (_yeaLength > _market.votersLimit()) revert ArrayLengthExceedsLimit();

        _checkVoters(_yeaVoters, _marketId, _market);
        _checkVoters(_nayVoters, _marketId, _market);

        _market.prepareVote(_yeaVoters, _nayVoters, _marketId);
    }

    // ==============================================================
    // Owner
    // ==============================================================

    function setKeeper(address _keeper, bool _status) external onlyOwner {
        keepers[_keeper] = _status;
    }

    // ==============================================================
    // Internal
    // ==============================================================

    // check voters are stakers and unique
    function _checkVoters(address[] calldata _voters, uint256 _marketId, IMarket _market) internal {
        uint256 _votersLength = _voters.length;
        for (uint256 i = 0; i < _votersLength; ++i) {
            uint256 _claimId = s.claimsLength(_marketId) - 1;
            uint256 _stakeAmount = s.userStake(_voters[i], s.claimKey(_marketId, _claimId));
            if (_stakeAmount == 0) revert NotStaker();
            bytes32 _userClaimKey = _market.userClaimKey(_marketId, _claimId, _voters[i]);
            if (isUniqueVoter[_userClaimKey]) revert NotUnique();
            isUniqueVoter[_userClaimKey] = true;
        }
    }
}