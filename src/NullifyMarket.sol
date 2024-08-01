// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {BaseMarket, DataTypes} from "./BaseMarket.sol";

contract NullifyMarket is BaseMarket {

    error AlreadyAttached();

    mapping(uint256 refMarketId => uint256 marketId) public refMarketToMarket;

    constructor(Initialize memory _init) BaseMarket(_init) {}

    function status(uint256 _refMarketId) external view returns (DataTypes.ClaimStatus) {
        uint256 _marketId = refMarketToMarket[_refMarketId];
        if (_marketId == 0) return DataTypes.ClaimStatus.None;
        return s.claims(_marketId)[s.claimsLength(_marketId) - 1].status;
    }

    function _isNullified(uint256) override internal pure returns (bool) {
        return false;
    }

    function _attachClaimMarket(uint256 _marketId, uint256 _refMarketId) override internal {
        if (refMarketToMarket[_refMarketId] != 0) revert AlreadyAttached();
        refMarketToMarket[_refMarketId] = _marketId;
    }
}