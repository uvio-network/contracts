// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMarkets} from "../../interfaces/IMarkets.sol";

interface IRandomizer {

    // ==============================================================
    // State variables
    // ==============================================================

    function isUniqueVoter(bytes32) external view returns (bool);

    // ==============================================================
    // Views
    // ==============================================================

    function triggerPrepareVote(uint256 _marketId) external view returns (bool);

    // ==============================================================
    // Mutative
    // ==============================================================

    function prepareVote(address[] calldata _yeaVoters, address[] calldata _nayVoters, uint256 _marketId) external;

    // ==============================================================
    // Errors
    // ==============================================================

    error NotKeeper();
    error ArrayLengthMismatch();
    error ArrayLengthZero();
    error ArrayLengthExceedsLimit();
    error NotStaker();
    error NotUnique();
    error InvalidLimit();
}