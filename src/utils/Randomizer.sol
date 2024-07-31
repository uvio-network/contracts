// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IStorage} from "../interfaces/IStorage.sol";
import {IMarket} from "../interfaces/IMarket.sol";

contract Randomizer {

    error ArrayLengthMismatch();
    error ArrayLengthZero();
    error ArrayLengthExceedsLimit();
    error NotStaker();
    error NotUnique();
    error WrongMarketType();

    mapping(bytes32 userClaimKey => bool isUnique) public isUniqueVoter;
    
    IStorage public immutable s;
    IMarket public immutable claimMarket;
    IMarket public immutable nullifyMarket;

    constructor(address _storage, address _claimMarket, address _nullifyMarket) {
        s = IStorage(_storage);
        claimMarket = IMarket(_claimMarket);
        nullifyMarket = IMarket(_nullifyMarket);
    }

    function triggerPrepareVote(uint256 _marketId) public view returns (bool) {
        uint256 _claimId = s.claimsLength(_marketId) - 1;
        if (_claimId == 0) return false;
        IStorage.Claim memory _claim = s.claims(_marketId)[_claimId];
        if (_claim.expiration <= block.timestamp && _claim.status == IStorage.ClaimStatus.Active) return true;
        return false;
    }

    function prepareVote(
        address[] calldata _yeaVoters,
        address[] calldata _nayVoters,
        uint256 _marketId,
        bool _isClaimMarket
    ) external {
        IMarket _market = _isClaimMarket ? claimMarket : nullifyMarket;
        if (!_market.isMarket(_marketId)) revert WrongMarketType();

        uint256 _yeaLength = _yeaVoters.length;
        uint256 _nayLength = _nayVoters.length;
        if (_yeaLength != _nayLength) revert ArrayLengthMismatch();
        if (_yeaLength == 0 && _nayLength == 0) revert ArrayLengthZero();
        if (_yeaLength > _market.votersLimit()) revert ArrayLengthExceedsLimit();

        _checkVoters(_yeaVoters, _marketId, _market);

        _market.prepareVote(_yeaVoters, _nayVoters, _marketId);
    }

    // check voters are stakers and unique
    function _checkVoters(address[] calldata _voters, uint256 _marketId, IMarket _market) internal {
        uint256 _votersLength = _voters.length;
        for (uint256 i = 0; i < _votersLength; i++) {
            uint256 _claimId = s.claimsLength(_marketId) - 1;
            uint256 _stakeAmount = s.userStake(_voters[i], s.claimKey(_marketId, _claimId));
            if (_stakeAmount == 0) revert NotStaker();
            bytes32 _userClaimKey = _market.userClaimKey(_marketId, _claimId, _voters[i]);
            if (isUniqueVoter[_userClaimKey]) revert NotUnique();
            isUniqueVoter[_userClaimKey] = true;
        }
    }
}