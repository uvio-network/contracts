// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ILender} from "../interface/ILender.sol";
import {IReceiver} from "../interface/IReceiver.sol";
import {IStablecoin} from "../interface/IStablecoin.sol";

contract Receiver is IReceiver {
    error Balance(string why, uint256 bal);

    constructor() {}

    function execute(address tk1, address tk2, uint256 bl1, uint256 bl2) external {
        // Every flash loan receiver needs to do something with token one. Here
        // we just burn the supply that the receiver received. The call to burn
        // below does only work if the receiver has in fact received the given
        // amount bl1. If the receiver is not the owner of those tokens, then
        // burn will revert and the whole flash loan falls apart without having
        // any effect.
        {
            IStablecoin(tk1).burn(address(this), bl1);
        }

        // Every flash loan receiver needs to do something with token two. Here
        // we simply mint the supply bl2 in order to credit the receiver. This
        // supply is supposed to be sent back to the lender after execute
        // finished.
        {
            IStablecoin(tk2).mint(address(this), bl2);
        }

        if (!IERC20(tk2).approve(msg.sender, bl2)) {
            revert Balance("approval failed", bl2);
        }
    }
}

contract ReceiverMintLess is IReceiver {
    error Balance(string why, uint256 bal);

    constructor() {}

    function execute(address tk1, address tk2, uint256 bl1, uint256 bl2) external {
        {
            IStablecoin(tk1).burn(address(this), bl1);
            IStablecoin(tk2).mint(address(this), bl2 - 1); // mint less than requested
        }

        if (!IERC20(tk2).approve(msg.sender, bl2)) {
            revert Balance("approval failed", bl2);
        }
    }
}

contract ReceiverNoApprove is IReceiver {
    error Balance(string why, uint256 bal);

    constructor() {}

    function execute(address tk1, address tk2, uint256 bl1, uint256 bl2) external {
        IStablecoin(tk1).burn(address(this), bl1);
        IStablecoin(tk2).mint(address(this), bl2);
    }
}

contract ReceiverReentrance is IReceiver {
    error Balance(string why, uint256 bal);

    constructor() {}

    function execute(address tk1, address tk2, uint256 bl1, uint256 bl2) external {
        {
            IStablecoin(tk1).burn(address(this), bl1);
        }

        {
            ILender(msg.sender).lend(address(this), tk1, tk2, bl1);
        }

        {
            IStablecoin(tk2).mint(address(this), bl2);
        }

        if (!IERC20(tk2).approve(msg.sender, bl2)) {
            revert Balance("approval failed", bl2);
        }
    }
}
