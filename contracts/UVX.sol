// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {ERC20, IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IReceiver} from "./interface/IReceiver.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract UVX is AccessControlEnumerable, ERC20, ReentrancyGuard {
    //
    // ERRORS
    //

    // Address is used to revert if any onchain identity was found to be invalid
    // for its intended purpose, e.g. the current token is not allowed to be
    // used.
    error Address(string why);
    // Balance is used to revert if any token balance related issues are
    // detected, e.g. the required balance repayment failed.
    error Balance(string why, uint256 bal);
    // Process is used to revert if any logical mechanism was found to be
    // prohibited, e.g. UVX could not be minted anymore because of the mint
    // function being frozen.
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
    // LOAN_ROLE is the role assigned internally to designate privileged
    // accounts with the purpose of automating flash loans. The goal for this
    // automation is to increase protocol revenue using the otherwise idle
    // tokens deposited into this smart contract.
    bytes32 public constant LOAN_ROLE = keccak256("LOAN_ROLE");
    // TOKEN_ROLE is the role assigned internally to designate token contracts
    // with the purpose of allowing the UVX token to be purchased and redeemed
    // using those tokens having the TOKEN_ROLE assigned.
    bytes32 public constant TOKEN_ROLE = keccak256("TOKEN_ROLE");

    // VERSION is the code release of https://github.com/uvio-network/contracts.
    string public constant VERSION = "v0.3.1";

    //
    // MAPPINGS
    //

    // _tokenDecimals caches the decimal numbers of our whitelisted token
    // contracts for more gas efficient reads during burn and sell.
    mapping(address => uint8) private _tokenDecimals;

    //
    // VARIABLES
    //

    // freeze ensures that no tokens can be minted anymore without providing
    // payment in return. That means, if freeze will eventually be true, then
    // mint() will become disabled, while sell() will remain functional.
    // Further, if freeze is set to true, it cannot be set back to false again.
    // That property makes freeze a kill switch for dilluting the UVX total
    // supply.
    bool public freeze = false;

    // owner is the owner address of the privileged entity being able to remove
    // all limitations of token transferability.
    address public owner;

    // outstanding tracks the amount of UVX tokens that cannot yet be fully
    // redeemed by the equivalent amount of whitelisted tokens.
    uint256 public outstanding;

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
            revert Address("owner invalid");
        }

        if (tok == address(0)) {
            revert Address("token invalid");
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

    // fund allows anyone to send any amount of whitelisted tokens to this
    // contract. The purpose of fund is to allow platform revenue to be posted
    // here, so that all outstanding UVX can be redeemed eventually. fund does
    // not provide UVX in exchange for the sent tokens. Therefore fund decreases
    // UVX outstanding.
    function fund(address tok, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // Cache the whitelisted token decimals on the first call and use the
        // cached version forever in order to safe gas. This caching mechanism
        // reduces the gas usage of fund calls. We don't care about tokens that
        // may have been removed from the whitelisted contracts, since the
        // number of tokens for which that is practically going to happen will
        // never reach double digits.
        uint8 dec = _tokenDecimals[tok];
        if (dec == 0) {
            dec = IERC20Metadata(tok).decimals();
            _tokenDecimals[tok] = dec;
        }

        // Decrease the outstanding balance by the funded amount. We do not use
        // "unchecked" here because we want to revert on underflows. This
        // ensures that we can only at maximum fund the UVX deficit until it is
        // completely eliminated. Here we also need to translate the given
        // balance into the given token precision, relative to its own decimals
        // and ours. Ours here is 18 decimals.
        if (dec < 18) {
            outstanding -= bal * (10 ** (18 - dec));
        } else if (dec > 18) {
            outstanding -= bal / (10 ** (dec - 18));
        } else {
            outstanding -= bal;
        }

        // Send the given tokens from the caller to this contract.
        if (!IERC20(tok).transferFrom(msg.sender, address(this), bal)) {
            revert Balance("transfer failed", bal);
        }
    }

    // transfer overwrites the ERC20 transfer function in order to ensure an
    // initial transferability restriction. This restriction aims to bootstrap a
    // controlled market inside of the Uvio platform without allowing financial
    // speculation to occur prematurely.
    function transfer(address to, uint256 bal) public override returns (bool) {
        if (restrict && !hasRole(CONTRACT_ROLE, msg.sender) && !hasRole(CONTRACT_ROLE, to)) {
            revert AccessControlUnauthorizedAccount(msg.sender, CONTRACT_ROLE);
        }

        {
            return super.transfer(to, bal);
        }
    }

    // transferFrom overwrites the ERC20 transferFrom function in order to
    // ensure an initial transferability restriction. This restriction aims to
    // bootstrap a controlled market inside of the Uvio platform without
    // allowing financial speculation to occur prematurely.
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
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // Send UVX from the caller to this contract. With this extra step we
        // require the user to specify an allowance for their own tokens to be
        // spent, because the user sends their own tokens away. Only once we own
        // the UVX sent to us, only then we can burn that portion of the supply.
        if (!super.transferFrom(msg.sender, address(this), bal)) {
            revert Balance("transfer failed", bal);
        }

        // Remove the given UVX balance from the total supply.
        {
            _burn(address(this), bal);
        }

        // Cache the whitelisted token decimals on the first call and use the
        // cached version forever in order to safe gas. This caching mechanism
        // reduces the gas usage of burn calls. We don't care about tokens that
        // may have been removed from the whitelisted contracts, since the
        // number of tokens for which that is practically going to happen will
        // never reach double digits.
        uint8 dec = _tokenDecimals[tok];
        if (dec == 0) {
            dec = IERC20Metadata(tok).decimals();
            _tokenDecimals[tok] = dec;
        }

        // Translate the given balance into the given token precision, relative
        // to its own decimals and ours. Ours here is 18 decimals.
        unchecked {
            if (dec < 18) {
                bal = bal / (10 ** (18 - dec));
            } else if (dec > 18) {
                bal = bal * (10 ** (dec - 18));
            }
        }

        // Send the given tokens from this contract to the caller.
        if (!IERC20(tok).transfer(msg.sender, bal)) {
            revert Balance("transfer failed", bal);
        }
    }

    // lend allows the LOAN_ROLE to effectively take out a flash loan of token
    // one "tk1" to the extend of this token's balance "bl1", under the
    // guarantee that the whitelisted receiver "rec" repays all of its debt in
    // the equivalent amount of the whitelisted token two "tk2". The whitelisted
    // receiver "rec" is a contract implementing the interface IReceiver. This
    // trusted smart contract may be invoked by anyone, by simply calling lend
    // and paying the gas for it. The trusted receiver implementation should
    // always be stateless and never hold funds for longer than the duration of
    // the currently processed transaction. Tokens one and two, here "tk1" and
    // "tk2" must both be whitelisted token contracts having the TOKEN_ROLE. Any
    // decimal differences between both tokens will be accounted for. The input
    // token balance "bl1" is always the balance of token one "tk1". The
    // inferred and subsequently injected token balance "bl2" refers to the
    // amount of tokens of token two "tk2", which must be repayed within the
    // same transaction. Token one and token two may be the same token.
    function lend(address rec, address tk1, address tk2, uint256 bl1) public nonReentrant {
        if (!hasRole(LOAN_ROLE, rec)) {
            revert AccessControlUnauthorizedAccount(rec, LOAN_ROLE);
        }

        if (!hasRole(TOKEN_ROLE, tk1)) {
            revert AccessControlUnauthorizedAccount(tk1, TOKEN_ROLE);
        }

        if (!hasRole(TOKEN_ROLE, tk2)) {
            revert AccessControlUnauthorizedAccount(tk2, TOKEN_ROLE);
        }

        uint256 bl2;
        {
            uint8 dc1 = _tokenDecimals[tk1];
            if (dc1 == 0) {
                dc1 = IERC20Metadata(tk1).decimals();
                _tokenDecimals[tk1] = dc1;
            }

            uint8 dc2 = _tokenDecimals[tk2];
            if (dc2 == 0) {
                dc2 = IERC20Metadata(tk2).decimals();
                _tokenDecimals[tk2] = dc2;
            }

            unchecked {
                if (dc1 < dc2) {
                    bl2 = bl1 * (10 ** (dc2 - dc1));
                } else if (dc1 > dc2) {
                    bl2 = bl1 / (10 ** (dc1 - dc2));
                } else {
                    bl2 = bl1;
                }
            }
        }

        // Send token one to the receiver. This is the part where we credit the
        // borrower temporarily.
        if (!IERC20(tk1).transfer(rec, bl1)) {
            revert Balance("borrow failed", bl1);
        }

        // Allow the borrower to execute their own arbitrary business logic.
        {
            IReceiver(rec).execute(tk1, tk2, bl1, bl2);
        }

        // Pull the expected amount of token two in order to settle the loan. If
        // the receiver did not approve the transfer below, then the entire
        // flash loan will revert.
        if (!IERC20(tk2).transferFrom(rec, address(this), bl2)) {
            revert Balance("repayment failed", bl2);
        }
    }

    // mint allows the BOT_ROLE to send new tokens to the given destination
    // address, to the extend of the given balance amount without expecting any
    // tokens in return. mint therefore increases UVX outstanding.
    function mint(address dst, uint256 bal) public {
        if (!hasRole(BOT_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, BOT_ROLE);
        }

        if (freeze) {
            revert Process("minting disabled");
        }

        {
            outstanding += bal;
        }

        {
            _mint(dst, bal);
        }
    }

    // sell allows this contract to sell UVX tokens to anyone who can send the
    // equal amount of whitelisted tokens in return for the requested balance.
    // In other words, when you call sell(address, 10), then you have to send 10
    // tokens in order to get 10 tokens. The provided token address must be a
    // whitelisted token contract, and the caller must have a sufficient token
    // balance in order to exchange the requested amount for UVX tokens.
    function sell(address tok, uint256 bal) public {
        if (!hasRole(TOKEN_ROLE, tok)) {
            revert AccessControlUnauthorizedAccount(tok, TOKEN_ROLE);
        }

        // Send the given tokens from the caller to this contract.
        if (!IERC20(tok).transferFrom(msg.sender, address(this), bal)) {
            revert Balance("transfer failed", bal);
        }

        // Cache the whitelisted token decimals on the first call and use the
        // cached version forever in order to safe gas. This caching mechanism
        // reduces the gas usage of sell calls. We don't care about tokens that
        // may have been removed from the whitelisted contracts, since the
        // number of tokens for which that is practically going to happen will
        // never reach double digits.
        uint8 dec = _tokenDecimals[tok];
        if (dec == 0) {
            dec = IERC20Metadata(tok).decimals();
            _tokenDecimals[tok] = dec;
        }

        // Translate the given balance into the given token precision, relative
        // to its own decimals and ours. Ours here is 18 decimals.
        unchecked {
            if (dec < 18) {
                bal = bal * (10 ** (18 - dec));
            } else if (dec > 18) {
                bal = bal / (10 ** (dec - 18));
            }
        }

        {
            _mint(msg.sender, bal);
        }
    }

    // updateFreeze can be called once by the owner in order to disable unpaid
    // token minting. Once token minting has been disabled, it cannot be enabled
    // again.
    function updateFreeze() public {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        if (freeze == true) {
            revert Process("already updated");
        }

        {
            freeze = true;
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
