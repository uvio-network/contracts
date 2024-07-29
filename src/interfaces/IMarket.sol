// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

interface IMarket {
    struct Initialize {
        uint256 maxClaims;
        uint256 minStake;
        uint256 minClaimDuration;
        uint256 votersLimit;
        uint256 votingDuration;
        uint256 disputeDuration;
        uint256 fee;
        address storage_;
        address owner;
        address randomizer;
    }

    struct Propose {
        string metadataURI;
        uint256 marketId;
        uint256 refMarketId;
        uint256 amount;
        uint256 marketMinStake;
        uint256 claimExpiration;
        uint256 stakingExpiration;
        bool yea;
    }
    function prepareVote(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId) external;
    function votersLimit() external view returns (uint256);
    function isMarket(uint256 _marketId) external view returns (bool);
}