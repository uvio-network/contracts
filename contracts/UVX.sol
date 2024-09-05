// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UVX is AccessControlEnumerable, ERC20 {
    //
    // ERRORS
    //

    //
    error Address(string why);
    //
    error Balance(string why, uint256 bal);
    //
    error Process(string why);

    //
    // CONSTANTS
    //

    // BOT_ROLE is the role assigned internally to designate privileged accounts
    // with the purpose of automating certain tasks on behalf of the users. The
    // goal for this automation is to enhance the user experience on the
    // platform, by ensuring certain chores are done throughout the token
    // lifecycle without bothering any user with it, nor allowing malicious
    // actors to exploit the system.
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");
    // CONTRACT_ROLE is the role assigned internally to designate smart
    // contracts with the purpose of allowing token transfers from and to those
    // addresses only, as long as token transferability is restricted. As soon
    // as "restrict" is set to false, the CONTRACT_ROLE has no effect anymore.
    bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
    // TOKEN_ROLE is the role assigned internally to designate token contracts
    // with the purpose of allowing the UVX token to be purchased and redeemed
    // using those tokens having the TOKEN_ROLE assigned.
    bytes32 public constant TOKEN_ROLE = keccak256("TOKEN_ROLE");

    // VERSION is the code release of https://github.com/uvio-network/contracts.
    string public constant VERSION = "v0.0.0";

    //
    // VARIABLES
    //

    // owner is the owner address of the privileged entity being able to remove
    // all limitations of token transferability.
    address public owner;

    // restrict ensures that UVX tokens cannot be transferred to unauthorized
    // accounts, as long as it is set to true. Once restrict is set to false,
    // UVX tokens can be freely transferred and used without any restrictions.
    // Further, if restrict is set to false, it cannot be set back to true
    // again. That property makes restrict a kill switch for unrestricted
    // transferability.
    bool public restrict = true;

    //
    // BUILTIN
    //

    // constructor initializes an instance of the UVX contract by assigning the
    // TOKEN_ROLE to the first token contract. The given owner address will be
    // able to modify the restrict flag and designate the BOT_ROLE.
    constructor(address own, address tok) ERC20("Uvio Network Token", "UVX") {
        if (own == address(0)) {
            revert Address("invalid owner");
        }

        if (tok == address(0)) {
            revert Address("invalid token");
        }

        // There is no real way to ensure that the given token contract is in
        // fact an ERC20. We are simply trying to call some function provided
        // with that interface and assume we have a real ERC20. This check
        // guards at least against EOAs, so that it is not possible anymore to
        // confuse the owner address with the token address.
        {
            IERC20(tok).totalSupply();
        }

        {
            _grantRole(DEFAULT_ADMIN_ROLE, own);
            _grantRole(TOKEN_ROLE, tok);
        }

        {
            owner = own;
        }
    }

    // receive is a no-op fallback to prevent any ETH to be sent to this
    // contract.
    receive() external payable {
        if (msg.value != 0) {
            revert Balance("invalid transfer", msg.value);
        }
    }

    //
    // PUBLIC
    //

    //
    function fund(address tok, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            // TODO test
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // TODO implement token funding to support UVX redemptions in burn()

        // Send the given tokens from the caller to this contract.
        if (!IERC20(tok).transferFrom(msg.sender, address(this), bal)) {
            // TODO test
            revert Balance("transfer failed", bal);
        }
    }

    function transfer(address to, uint256 bal) public override returns (bool) {
        if (restrict && !hasRole(CONTRACT_ROLE, msg.sender) && !hasRole(CONTRACT_ROLE, to)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CONTRACT_ROLE);
        }

        {
            return super.transfer(to, bal);
        }
    }

    function transferFrom(address src, address dst, uint256 bal) public override returns (bool) {
        if (restrict && !hasRole(CONTRACT_ROLE, src) && !hasRole(CONTRACT_ROLE, dst)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CONTRACT_ROLE);
        }

        {
            return super.transferFrom(src, dst, bal);
        }
    }

    //
    // PUBLIC PRIVILEGED
    //

    // burn allows the caller to exchange the given balance amount of UVX tokens
    // for the same amount of tokens represented by the token contract "tok",
    // which must be
    function burn(address tok, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            // TODO test
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        if (!IERC20(tok).approve(address(this), bal)) {
            revert Balance("approval failed", bal);
        }

        // Send the given tokens from this contract to the caller.
        if (!IERC20(tok).transferFrom(address(this), msg.sender, bal)) {
            // TODO test
            revert Balance("transfer failed", bal);
        }

        // Send UVX from the caller to this contract.
        if (!IERC20(this).transferFrom(msg.sender, address(this), bal)) {
            // TODO test
            revert Balance("transfer failed", bal);
        }

        // Remove the given UVX balance from the total supply.
        {
            // TODO test
            _burn(msg.sender, bal);
        }
    }

    // mint allows the BOT_ROLE to send new tokens to the given destination
    // address, to the extend of the given balance amount.
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
            // TODO test
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // TODO only sell tokens if the equal amount of stablecoins is received from dst

        {
            // TODO test
            _mint(dst, bal);
        }
    }

    // updateOwner allows the owner to transfer ownership to another address.
    // The new address "own" must not be the zero address, and it must not be
    // the current owner.
    function updateOwner(address own) public {
        // Inlining the role check instead of using the modifier saves about 140
        // gas per call.
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        if (own == address(0) || own == owner) {
            revert Process("owner invalid");
        }

        {
            _revokeRole(DEFAULT_ADMIN_ROLE, owner);
            _grantRole(DEFAULT_ADMIN_ROLE, own);
        }

        {
            owner = own;
        }
    }

    // updateRestrict can be called once by the owner in order to remove all
    // limitations of token transferability. Once those transfer limitations are
    // removed, they cannot be put back in place.
    function updateRestrict() public {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        if (restrict == false) {
            revert Process("already updated");
        }

        {
            restrict = false;
        }
    }
}
