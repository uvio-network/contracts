// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {INullifyMarket} from "./interfaces/INullifyMarket.sol";

import {BaseMarket, IStorage} from "./BaseMarket.sol";

contract ClaimMarket is BaseMarket {

    error NullifyMarketNotResolved();
    error NotNullifyMarket();

    INullifyMarket public immutable nullifyMarket;

    constructor(Initialize memory _init, address _nullifyMarket) BaseMarket(_init) {
        nullifyMarket = INullifyMarket(_nullifyMarket);
    }

    function _isNullified(uint256 _marketId) override internal view returns (bool isNullified_) {
        IStorage.ClaimStatus _nullifyMarketStatus = nullifyMarket.status(_marketId);
        if (_nullifyMarketStatus != IStorage.ClaimStatus.None) {
            if (_nullifyMarketStatus == IStorage.ClaimStatus.ResolvedYea) {
                return true;
            } else if (
                _nullifyMarketStatus == IStorage.ClaimStatus.ResolvedNay ||
                _nullifyMarketStatus == IStorage.ClaimStatus.Nullified
            ) {
                return false;
            } else {
                revert NullifyMarketNotResolved();
            }
        }
    }

    function _attachClaimMarket(uint256 _marketId, uint256 _refMarketId) override internal {
        if (_refMarketId != 0) revert NotNullifyMarket();
        isMarket[_marketId] = true;
    }
}