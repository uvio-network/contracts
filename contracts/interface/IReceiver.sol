// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReceiver {
    // execute is the flash loan callback in which arbitrary business logic may
    // be implemented. If called, the receiver is guaranteed to be temporarily
    // credited with "bl1" amount of tokens "tk1". For the loan amount to be
    // borrowed temporarily, the receiver must approve "bl2" amount of tokens
    // "tk2" inside of its own implementation of execute, in order to allow the
    // lender "msg.sender" to settle the loan in the same transaction.
    //
    //     if (!IERC20(tk2).approve(msg.sender, bl2)) {
    //         revert Balance("approval failed", bl2);
    //     }
    //
    function execute(address tk1, address tk2, uint256 bl1, uint256 bl2) external;
}
