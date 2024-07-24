// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IStorageReader, IStorage} from "./interfaces/IStorageReader.sol";

contract Market {

    event Propose(address indexed proposer, uint256 indexed marketId, uint256 indexed claimId, string ref, uint256 stake, uint256 claimExpiration, uint256 stakingExpiration, bool yea);

    uint256 public maxClaims = 5;
    uint256 public minStake = 1 ether;
    uint256 public minClaimDuration = 1 days;
    // uint256 public votersLimit = 5;
    // uint256 public votingDuration = 1 days;
    // uint256 public disputeDuration = 1 days;
    // bool public resolved = false;
    // bool public goToCommittee = false;

    IStorageReader public immutable s;

    // ==============================================================
    // Constructor
    // ==============================================================

    constructor(address _storage) {
        s = IStorageReader(_storage);
    }

    // ==============================================================
    // Mutative
    // ==============================================================

    function propose(
        string calldata _ref,
        uint256 _marketId,
        uint256 _stake,
        uint256 _claimExpiration,
        uint256 _stakingExpiration,
        bool _yea
    ) external {
        if (_claimExpiration < block.timestamp + minClaimDuration) revert();
        if (_stakingExpiration < _claimExpiration) revert();
        if (_stake < minStake) revert();

        if (bytes(_ref).length != 0) _marketId = s.newMarketId();
        if (_marketId >= s.marketId()) revert();

        IStorageReader.Claim[] memory _claims = s.claims(_marketId);

        uint256 _claimsLength = _claims.length;
        IStorageReader.Claim memory _lastClaim = _claims[_claimsLength];
        if (_lastClaim.status == IStorage.ClaimStatus.Active) revert();
        if (_lastClaim.status == IStorage.ClaimStatus.Resolved) revert();
        if (_claimsLength >= maxClaims) revert();

        IStorageReader.Stake memory _stakeInfo;
        {
            address[] memory _stakers = new address[](1);
            _stakers[0] = msg.sender;
            if (_yea) {
                _stakeInfo = IStorage.Stake({
                    yea: _stake,
                    nay: 0,
                    expiration: _stakingExpiration,
                    yeaStakers: _stakers,
                    nayStakers: new address[](0)
                });
            } else {
                _stakeInfo = IStorage.Stake({
                    yea: 0,
                    nay: _stake,
                    expiration: _stakingExpiration,
                    yeaStakers: new address[](0),
                    nayStakers: _stakers
                });
            }
        }

        IStorageReader.Claim memory _claimInfo;
        {
            IStorageReader.Vote memory _voteInfo;
            _claimInfo = IStorage.Claim({
                ref: _ref,
                expiration: _claimExpiration,
                stake: _stakeInfo,
                vote: _voteInfo,
                status: IStorage.ClaimStatus.Active
            });
        }

        s.updateStake(_stake, s.userStakeKey(msg.sender, _marketId, _claimsLength, _yea));
        s.updateClaim(_claimInfo, _marketId, _claimsLength);

        emit Propose(msg.sender, _marketId, _claimsLength, _ref, _stake, _claimExpiration, _stakingExpiration, _yea);
    }
}