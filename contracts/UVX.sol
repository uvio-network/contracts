// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UVX is AccessControlEnumerable, ERC20 {
    //
    // ERRORS
    //

    //
    error Address(string why);

    //
    // CONSTANTS
    //

    //
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");
    //
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
    //
    bytes32 public constant TOKEN_ROLE = keccak256("TOKEN_ROLE");

    //
    // VARIABLES
    //

    // restricted ensures that UVX tokens cannot be transferred to unauthorized
    // accounts, as long as it is set to true. Once restricted is set to false,
    // UVX tokens can be freely transferred and used without any restrictions.
    // Further, if restricted is set to false, it cannot be set back to true
    // again. That property makes restricted a kill switch for unrestricted
    // transferability.
    bool public restricted = true; // TODO implement kill switch

    //
    // BUILTIN
    //

    //
    constructor(address own, address tok) ERC20("Uvio Network Token", "UVX") {
        if (own == address(0)) {
            revert Address("invalid owner");
        }

        if (tok == address(0)) {
            revert Address("invalid token");
        }

        {
            _grantRole(DEFAULT_ADMIN_ROLE, own);
            _grantRole(TOKEN_ROLE, tok);
        }
    }

    // burn the given balance amount from the given source address.
    function burn(address tok, address src, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // TODO only burn tokens if the equal amount of stablecoins is send to src

        {
            _burn(src, bal);
        }
    }

    function fund(address tok, uint256 bal) public {
        // TODO implement token funding to support UVX redemptions in burn()
    }

    // mint the given balance amount to the given destination address.
    function mint(address dst, uint256 bal) public {
        if (!hasRole(BOT_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, BOT_ROLE);
        }

        {
            _mint(dst, bal);
        }
    }

    function sell(address tok, address dst, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // TODO only sell tokens if the equal amount of stablecoins is received from dst

        {
            _mint(dst, bal);
        }
    }

    function transfer(address to, uint256 bal) public override returns (bool) {
        if (restricted && !hasRole(CONTRACT_ROLE, msg.sender) && !hasRole(CONTRACT_ROLE, to)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CONTRACT_ROLE);
        }

        {
            return super.transfer(to, bal);
        }
    }

    function transferFrom(address src, address dst, uint256 bal) public override returns (bool) {
        if (restricted && !hasRole(CONTRACT_ROLE, src) && !hasRole(CONTRACT_ROLE, dst)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CONTRACT_ROLE);
        }

        {
            return super.transferFrom(src, dst, bal);
        }
    }
}
