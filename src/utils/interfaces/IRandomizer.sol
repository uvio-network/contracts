// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IStorage} from "../../interfaces/IStorage.sol";
import {IMarket} from "../../interfaces/IMarket.sol";

interface IRandomizer {

    // ==============================================================
    // State variables
    // ==============================================================

    function isUniqueVoter(bytes32) external view returns (bool);
    function s() external view returns (IStorage);
    function claimMarket() external view returns (IMarket);
    function nullifyMarket() external view returns (IMarket);

    // ==============================================================
    // Views
    // ==============================================================

    function triggerPrepareVote(uint256 _marketId) external view returns (bool);

    // ==============================================================
    // Mutative
    // ==============================================================

    function prepareVote(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId, bool _isClaimMarket) external;

    // ==============================================================
    // Errors
    // ==============================================================

    error NotKeeper();
    error ArrayLengthMismatch();
    error ArrayLengthZero();
    error ArrayLengthExceedsLimit();
    error NotStaker();
    error NotUnique();
}