// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControlEnumerable} from "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";
import {Bits} from "./lib/Bits.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IToken} from "./interface/IToken.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Claims is AccessControlEnumerable {
    //
    // EXTENSIONS
    //

    // Bits is a small bitmap library for us to keep track of boolean logic in
    // the most gas efficient way.
    using Bits for Bits.Map;

    //
    // ERRORS
    //

    // Address is used to revert if any onchain identity was found to be invalid
    // for its intended purpose, e.g. the current user is not allowed to do
    // something.
    error Address(string why);
    // Balance is used to revert if any token balance related issues are
    // detected, e.g. the required minimum balance is not being met.
    error Balance(string why, uint256 bal);
    // Expired is used to revert if any expiration date related issues are
    // detected, e.g. the provided expiry is too short.
    error Expired(string why, uint256 unx);
    // Mapping is used to revert if any object relationship was found to be
    // violated, e.g. a claim was tried to be created using an ID of another
    // claim that already exists.
    error Mapping(string why);
    // Process is used to revert if any logical mechanism was found to be
    // prohibited, e.g. a dispute was tried to be created for a propose that got
    // already disputed the maximum amount of times.
    error Process(string why);

    //
    // EVENTS
    //

    // BalanceUpdated is emitted when user balances have been updated, whether
    // for a propose or dispute, and whether the original propose has been
    // settled onchain or not.
    //
    //     pod is the propose or dispute for which user balances got updated
    //
    event BalanceUpdated(uint256 pod);

    // ClaimUpdated is emitted when a claim is updated, whether it is a propose
    // or dispute.
    //
    //     pod is the ID of the propose or dispute that got updated
    //     use is the user updating the propose
    //     bal is the amount of reputation aditionally staked
    //
    event ClaimUpdated(uint256 pod, address use, uint256 bal);

    // DisputeCreated is emitted when a dispute is created.
    //
    //     dis is the ID of the dispute that got created
    //     use is the user creating the dispute
    //     bal is the amount of reputation initially staked
    //     exp is the expiry of the new dispute
    //
    event DisputeCreated(uint256 dis, address use, uint256 bal, uint64 exp);

    // DisputeSettled is emitted when a dispute is settled. Once a dispute is
    // settled all user balances are updated, which makes the consensus reached
    // definitive and binding. For the final dispute in a tree of claims that
    // means the outcome generated here will be applied to the whole tree.
    //
    //     dis is the ID of the dispute being settled
    //     all is the amount of stakers that participated in that market
    //     yay is the amount of voters having voted true
    //     nah is the amount of voters having voted false
    //     tot is the amount of staked reputation being distributed
    //
    event DisputeSettled(uint256 dis, uint256 all, uint256 yay, uint256 nah, uint256 tot);

    // ProposeCreated is emitted when a propose is created.
    //
    //     pro is the ID of the propose that got created
    //     use is the user creating the propose
    //     bal is the amount of reputation initially staked
    //     exp is the expiry of the new propose
    //
    event ProposeCreated(uint256 pro, address use, uint256 bal, uint64 exp);

    // ProposeSettled is emitted when a propose is settled. Once a propose is
    // settled all user balances are updated, which makes the consensus reached
    // definitive and binding.
    //
    //     pro is the ID of the propose being settled
    //     all is the amount of stakers that participated in that market
    //     yay is the amount of voters having voted true
    //     nah is the amount of voters having voted false
    //     tot is the amount of staked reputation being distributed
    //
    event ProposeSettled(uint256 pro, uint256 all, uint256 yay, uint256 nah, uint256 tot);

    // ResolveCreated is emitted when a resolve is created.
    //
    //     pod is the propose or dispute for which the resolve got created
    //     use is the user creating the resolve
    //     len is the amount of voters randomly sampled
    //     exp is the expiry of the new resolve
    //
    event ResolveCreated(uint256 pod, address use, uint256 len, uint64 exp);

    //
    // CONSTANTS
    //

    // ADDRESS_STAKE_Y is a map index within _addressStake. This number tracks
    // the amount of tokens a user has staked in agreement with the associated
    // claim.
    uint8 public constant ADDRESS_STAKE_Y = 0;
    // ADDRESS_STAKE_N is a map index within _addressStake. This number tracks
    // the amount of tokens a user has staked in disagreement with the
    // associated claim.
    uint8 public constant ADDRESS_STAKE_N = 1;

    // BASIS_FEE is the deducated amount of stake in basis points, from which
    // fees have been subtracted already. This number is the basis for our
    // internal accounting when distributing staked tokens during market
    // resolution.
    uint16 public constant BASIS_FEE = 9_000;
    // BASIS_PROPOSER is the amount of proposer fees in basis points, which are
    // deducted from the losing pool of funds before updating user balances.
    // This is the amount that users may earn by creating claims, if there are
    // tokens on the losing side to take away from.
    uint16 public constant BASIS_PROPOSER = 500;
    // BASIS_PROTOCOL is the amount of protocol fees in basis points. This
    // constant is not used anywhere, but only represented here for completeness
    // and documentation. The process of updating user balances distributes
    // funds to everyone who is owed their fair share as implemented by this
    // smart contract. The remainder is then given to the protocol owner, which
    // is also how we account for precision loss.
    uint16 public constant BASIS_PROTOCOL = 500;
    // BASIS_TOTAL is the total amount of basis points in 100%. This amount is
    // used to calculate fees and their remainders.
    uint16 public constant BASIS_TOTAL = 10_000;

    // BOT_ROLE is the role assigned internally to designate privileged accounts
    // with the purpose of automating certain tasks on behalf of the users. The
    // goal for this automation is to enhance the user experience on the
    // platform, by ensuring certain chores are done throughout the claim
    // lifecycle without bothering any user with it, nor allowing malicious
    // actors to exploit the system.
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");

    // CLAIM_ADDRESS_Y is a map index within _indexMembers. This number tracks
    // the latest incremented index of user addresses having staked reputation
    // in agreement with the associated claim.
    uint8 public constant CLAIM_ADDRESS_Y = 0;
    // CLAIM_ADDRESS_N is a map index within _indexMembers. This number tracks
    // the latest decremented index of user addresses having staked reputation
    // in disagreement with the associated claim.
    uint8 public constant CLAIM_ADDRESS_N = 1;

    // CLAIM_BALANCE_V is a bitmap index within _claimBalance. This boolean
    // tracks claims that got settled with a valid resolution.
    uint8 public constant CLAIM_BALANCE_V = 0;
    // CLAIM_BALANCE_S is a bitmap index within _claimBalance. This boolean
    // tracks claims that got already fully settled onchain.
    uint8 public constant CLAIM_BALANCE_S = 1;

    // CLAIM_EXPIRY_P is a map index within _claimExpired. This number tracks
    // the expiry of claims with lifecycle "propose" and "dispute" in unix
    // seconds.
    uint8 public constant CLAIM_EXPIRY_P = 0;
    // CLAIM_EXPIRY_R is a map index within _claimExpired. This number tracks
    // the expiry of claims with lifecycle "resolve" in unix seconds.
    uint8 public constant CLAIM_EXPIRY_R = 1;
    // CLAIM_EXPIRY_T is a map index within _claimExpired. This number tracks
    // the timestamp in unix seconds until which staking is still possible.
    uint8 public constant CLAIM_EXPIRY_T = 2;

    // CLAIM_STAKE_Y is a map index within _stakePropose. This number tracks the
    // total amount of staked reputation agreeing with the associated claim.
    uint8 public constant CLAIM_STAKE_Y = 0;
    // CLAIM_STAKE_N is a map index within _stakePropose. This number tracks the
    // total amount of staked reputation disagreeing with the associated claim.
    uint8 public constant CLAIM_STAKE_N = 1;
    // CLAIM_STAKE_A is a map index within _stakePropose. This number tracks the
    // minimum amount of stake required in order to participate in any given
    // claim when the proposed claim first voted true.
    uint8 public constant CLAIM_STAKE_A = 2;
    // CLAIM_STAKE_B is a map index within _stakePropose. This number tracks the
    // minimum amount of stake required in order to participate in any given
    // claim when the proposed claim first voted false.
    uint8 public constant CLAIM_STAKE_B = 3;
    // CLAIM_STAKE_C is a map index within _stakePropose. This number tracks the
    // amount of distributed stake that we carried over during multiple calls of
    // updateBalance.
    uint8 public constant CLAIM_STAKE_C = 4;
    // CLAIM_STAKE_D is a map index within _stakePropose. This number tracks the
    // amount of users for which we distributed stake already throughout the
    // process of updating user balances. This number must match the total
    // amount of stakers before any claim can fully be resolved.
    uint8 public constant CLAIM_STAKE_D = 5;

    // CLAIM_TRUTH_Y is a map index within _truthResolve. This number tracks the
    // total amount of votes cast saying the associated claim was true.
    uint8 public constant CLAIM_TRUTH_Y = 0;
    // CLAIM_TRUTH_N is a map index within _truthResolve. This number tracks the
    // total amount of votes cast saying the associated claim was false.
    uint8 public constant CLAIM_TRUTH_N = 1;

    // MAX_UINT256 represents the end of the possible integer sequence.
    uint256 public constant MAX_UINT256 = type(uint256).max;
    // MID_UINT256 represents the mid point of the possible integer sequence. We
    // use this mid point to identify on which sides our indices are along the
    // integer sequence.
    uint256 public constant MID_UINT256 = type(uint256).max / 2;

    // VERSION is the code release of https://github.com/uvio-network/contracts.
    string public constant VERSION = "v0.3.1";

    // VOTE_STAKE_Y is a bitmap index within _addressVotes. This boolean tracks
    // users who expressed their opinions by staking in agreement with the
    // proposed claim.
    uint8 public constant VOTE_STAKE_Y = 0;
    // VOTE_STAKE_N is a bitmap index within _addressVotes. This boolean tracks
    // users who expressed their opinions by staking in disagreement with the
    // proposed claim.
    uint8 public constant VOTE_STAKE_N = 1;
    // VOTE_TRUTH_Y is a bitmap index within _addressVotes. This boolean tracks
    // users who verified real events by voting for the proposed claim to be
    // true.
    uint8 public constant VOTE_TRUTH_Y = 2;
    // VOTE_TRUTH_N is a bitmap index within _addressVotes. This boolean tracks
    // users who verified real events by voting for the proposed claim to be
    // false.
    uint8 public constant VOTE_TRUTH_N = 3;
    // VOTE_TRUTH_S is a bitmap index within _addressVotes. This boolean tracks
    // users who have been selected and authorized to participate in the random
    // truth sampling process.
    uint8 public constant VOTE_TRUTH_S = 4;
    // VOTE_TRUTH_V is a bitmap index within _addressVotes. This boolean tracks
    // users who have cast their vote already.
    uint8 public constant VOTE_TRUTH_V = 5;

    //
    // MAPPINGS
    //

    // _addressStake keeps track of staked reputation per claim, per user, per
    // side of the market. The uint8 index here is either ADDRESS_STAKE_Y or
    // ADDRESS_STAKE_N. This detailed accounting enables users to bet on either
    // side of any given market and be rewarded or punished according to the
    // market's resolution.
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) private _addressStake;
    // _addressVotes maintains voting specific information per claim, per user
    // in a gas efficient bitmap implementation. For more information on the
    // various boolean flags used here, see VOTE_STAKE_Y, VOTE_STAKE_N,
    // VOTE_TRUTH_Y, VOTE_TRUTH_N, VOTE_TRUTH_S and VOTE_TRUTH_V.
    mapping(uint256 => mapping(address => Bits.Map)) private _addressVotes;
    // _allocBalance contains the allocated balance every user has in this smart
    // contract. Allocated balances may increase by creating claims or by
    // participating in their markets through staking. The allocated balance is
    // the part of the user balance that cannot be withdrawn.
    mapping(address => uint256) private _allocBalance;
    // _availBalance contains the available balance every user has in this smart
    // contract. Available balances may increase if staked reputation is
    // distributed to users who where found to be right upon market resolution.
    // The available balance is the part of the user balance that can be
    // withdrawn any time.
    mapping(address => uint256) private _availBalance;
    // _claimBalance maintains boolean flags relevant for balance processing
    // states per claim. For more information on the overall process and logic,
    // see updateBalance, CLAIM_BALANCE_V, CLAIM_BALANCE_S.
    mapping(uint256 => Bits.Map) private _claimBalance;
    // _claimExpired tracks expiration dates for every claim. For more
    // information see CLAIM_EXPIRY_P, CLAIM_EXPIRY_R and CLAIM_EXPIRY_T.
    mapping(uint256 => mapping(uint8 => uint256)) private _claimExpired;
    // _claimIndices contains all user indices as selected by the random truth
    // sampling process. For more information on how those indices are written
    // and read, see createResolve and searchSamples.
    mapping(uint256 => uint256[]) private _claimIndices;
    // _claimDispute tracks the number of disputes in _claimMapping per propose.
    mapping(uint256 => uint256) private _claimDispute;
    // _claimMapping has any claim ID as key and points to the latest dispute
    // within that tree, if any.
    mapping(uint256 => uint256) private _claimMapping;
    // _claimContent contains arbitrary references to prove the integrity of the
    // claim's associated content in external systems, whether those external
    // systems are offchain or onchain. If the external content source is
    // offchain, then the proof linked here may be the checksum of the hashed
    // content. If the external content source is onchain, then the proof linked
    // here may be the hash of a transaction.
    mapping(uint256 => string) private _claimContent;
    // _indexAddress tracks the user addresses that have reputation staked in
    // any given market. This mapping works in conjunction with _indexMembers.
    // The position of the user addresses are divided by side of the bet that
    // any given user chose to stake reputation on first. Users can stake
    // reputation however and whenever they want on any side of any given
    // market. Regardless, the side chosen first is the side for which users may
    // be selected for during the random truth sampling process. Therefore,
    // addresses staked in agreement will have incrementing indices on the yay
    // side of the numerical sequence. Following that, addresses staked in
    // disagreement will have decrementing indices on the nah side of the
    // numerical sequence. The mid point of this numerical sequence is reserved
    // for the proposer, the user creating any given claim. This mechanism is
    // practically sufficient because there is more capacity on either side of
    // this sequence than there are humans on this planet a million times over.
    //
    //      yay           mid                 nah
    //
    //     [0   ...   (2^256-1)/2   ...   2^256-1]
    //
    mapping(uint256 => mapping(uint256 => address)) private _indexAddress;
    // _indexMembers tracks the amount of stakers participating in any given
    // market. The first uint256 map key is the claim ID for which users
    // expressed opinions on. The second uint8 map key is either CLAIM_ADDRESS_Y
    // or CLAIM_ADDRESS_N. This mapping works in conjunction with _indexAddress,
    // because the numerical values tracked here for either side of any given
    // market represent the address indices of the respective stakers as
    // maintained by _indexAddress.
    mapping(uint256 => mapping(uint8 => uint256)) private _indexMembers;
    // _proposeToken is the optional per claim token whitelist that can be set
    // when calling createPropose. If set, users must have a non-zero balance of
    // any of the tokens whitelisted here, in order to participate in the given
    // market. This can be used to limit staking to community addresses holding
    // the community token. Relevant here is that balanceOf returns any amount
    // greater than 0.
    mapping(uint256 => address[]) private _proposeToken;
    // _truthResolve tracks the amount of votes cast per claim, on either side
    // of the market. The uint8 keys are either CLAIM_TRUTH_Y or CLAIM_TRUTH_N.
    // The uint256 values are the amounts of votes cast respectively.
    mapping(uint256 => mapping(uint8 => uint256)) private _truthResolve;
    // _stakePropose tracks claim specific metrics about user stakes and their
    // distribution. For more information see CLAIM_STAKE_Y, CLAIM_STAKE_N,
    // CLAIM_STAKE_A, CLAIM_STAKE_B, CLAIM_STAKE_C and CLAIM_STAKE_D.
    mapping(uint256 => mapping(uint8 => uint256)) private _stakePropose;

    //
    // VARIABLES
    //

    // durationBasis is the concluding timespan of a claim's expiry in basis
    // points, during which staking is not allowed anymore. For instance, if a
    // claim's expiry is in 5 days, then reputation can be staked on this claim
    // up until the last 10% of those 120 hours, which implies the last 12
    // hours.
    uint64 public durationBasis = 1_000;
    // durationMax is the maximum concluding timespan of a claim's expiry in
    // seconds, during which staking is not allowed anymore. For instance, if a
    // claim's expiry is in 90 days, then reputation can be staked on this claim
    // up until the last 7 days.
    uint64 public durationMax = 7 days;
    // durationMax is the minimum concluding timespan of a claim's expiry in
    // seconds, during which staking is not allowed anymore. For instance, if a
    // claim's expiry is in 24 hours, then reputation can be staked on this
    // claim up until the last 3 hours.
    uint64 public durationMin = 3 hours;

    // owner is the owner address of the privileged entity receiving protocol
    // fees.
    address public owner;
    // token is the token address for this instance of the deployed contract.
    // That means every deployed contract is only responsible for serving claims
    // denominated in any given token address.
    address public immutable token;

    //
    // BUILTIN
    //

    // constructor initializes an instance of the Claims contract by setting the
    // provided token address, which is immutable, meaning any Claims instance
    // will only ever use a single token. Multiple instances may be deployed to
    // support multiple tokens across the platform. The given owner address will
    // be able to modify the fee structure and designate the BOT_ROLE.
    constructor(address own, address tok) {
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
            IToken(tok).totalSupply();
        }

        // Additionally to the above, we want to ensure that Claims contracts
        // cannot be deployed for tokens that do not provide at least 6 decimals
        // for their internal accounting. For instance, USDC has exactly 6
        // decimals defined, and is therefore a valid token to be used.
        {
            uint8 dec = IToken(tok).decimals();
            if (dec < 6) {
                revert Balance("decimals invalid", dec);
            }
        }

        {
            _grantRole(DEFAULT_ADMIN_ROLE, own);
        }

        {
            owner = own;
            token = tok;
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

    // createDispute may be called by anyone to dispute an already existing
    // claim. This means that a new market is created, which disputes the
    // resolution of the provided claim. The given claim ID "dis" must be
    // unique. The given balance "bal" must be exactly twice as high as the
    // minimum balance required to participate in the market of the disputed
    // propose. The caller must further own the given balance either as
    // available balance inside this Claims contract or as available balance
    // inside the relevant token contract. The given expiry must be at least 72
    // hours in the future and must not be farther in the future than 30 days
    // from now. Disputes may be layered up to a maximum of 2 instances on top
    // of the original claim, so that resolutions may be definitive and binding
    // eventually. Only one dispute per disputed claim can be active at a time.
    // Punished claims without valid resolution cannot be disputed. Below is
    // shown how the resolution of propose 33 can be challenged twice, where 101
    // and 102 are the unique IDs of the new disputes to create.
    //
    //     createDispute(101, ..., ..., ..., 33)
    //     createDispute(102, ..., ..., ..., 33)
    //
    function createDispute(uint256 dis, uint256 bal, bool vot, uint64 exp, string memory con, uint256 pro) public {
        if (dis == 0) {
            revert Mapping("dispute zero");
        }

        if (_claimExpired[dis][CLAIM_EXPIRY_P] != 0) {
            revert Mapping("claim invalid");
        }

        uint256 len = _claimDispute[pro];
        if (len >= 2) {
            revert Process("dispute limit");
        }

        uint256 lat = _claimMapping[pro];
        unchecked {
            uint256 min;
            uint256 xpn;
            if (len == 0) {
                // If len is zero, then it means there are no disputes recorded.
                // If lat is not zero, then it means there is a mapping from
                // dispute to dispute within the same tree. This inconsistency
                // suggests that the caller made a mistake by providing a
                // dispute ID as "pro" instead of a propose ID.
                if (lat != 0) {
                    revert Mapping("dispute conflict");
                }

                {
                    min = (_stakePropose[pro][CLAIM_STAKE_A] + _stakePropose[pro][CLAIM_STAKE_B]);
                    xpn = _claimExpired[pro][CLAIM_EXPIRY_R];
                }
            } else {
                {
                    min = (_stakePropose[lat][CLAIM_STAKE_A] + _stakePropose[lat][CLAIM_STAKE_B]);
                    xpn = _claimExpired[lat][CLAIM_EXPIRY_R];
                }
            }

            // The first dispute can only be created if the disputed claim has
            // already been resolved. All following disputes can then also only
            // be created after the original propose resolved.
            //
            // Disputes can only be layered if the disputed dispute has already
            // been resolved.
            //
            // Here we make sure the disputed claim does even exist in the first
            // place.
            if (xpn > block.timestamp) {
                revert Expired("dispute active", xpn);
            }

            // The first dispute can only be created if the disputed claim is
            // still within its own challenge window.
            //
            // Disputes can only be layered if the disputed dispute is within
            // its own challenge window.
            if (xpn + 7 days < block.timestamp) {
                revert Expired("challenge invalid", xpn + 7 days);
            }

            // Disputes require an exact amount to be matched for the minimum
            // balance required. This amount is a multiple of the preceding
            // claim. We enforce a fixed minimum amount for disputes to prevent
            // malicious actors to artificially price out other market
            // participants. Once a dispute is created, anyone can still stake
            // as much reputation as they are willing to risk.
            if (bal != (min * 2)) {
                revert Balance("minimum invalid", (min * 2));
            }
        }

        // Only a valid resolution can be disputed. A resolution is valid if
        // there have been more votes on one side than on the other. That means
        // a resolution without any vote, or a resolution with equal votes
        // cannot be disputed. Those invalid resolutions are the punishable
        // scenarios, which are definitive and binding.
        uint256 yay = _truthResolve[pro][CLAIM_TRUTH_Y];
        uint256 nah = _truthResolve[pro][CLAIM_TRUTH_N];
        if (yay == nah) {
            revert Process("dispute invalid");
        }

        // Every claim in a tree of disputes points to the latest dispute
        // recorded in that tree. If a previous dispute was already recorded for
        // the given propose, then this value will be overwritten by the
        // currently provided dispute.
        {
            _claimMapping[pro] = dis;
        }

        // The exception for pointing to the latest dispute, is the latest
        // dispute itself. Below we make it point back to the originally
        // disputed propose, so that we can lookup the origin of the tree in
        // updateBalance.
        {
            _claimMapping[dis] = pro;
        }

        // If there was a latest dispute recorded before the currently given
        // dispute was tried to be created, then we are effectively creating a
        // mapping from the first dispute to the second dispute.
        if (lat != 0) {
            _claimMapping[lat] = dis;
        }

        // Dispute expiries must be at least 3 days in the future.
        if (exp < block.timestamp + 3 days) {
            revert Expired("too short", exp);
        }

        // Dispute expiries must not be more than 1 month in the future.
        if (exp > block.timestamp + 30 days) {
            revert Expired("too long", exp);
        }

        // In case this is the creation of a claim with lifecycle "propose",
        // store the first balance for the side of the stake as provided, so
        // that we can remember the minimum balance required for staking
        // reputation on this claim, while also being able to find the
        // proposer address without explicitly storing it.
        if (vot) {
            _stakePropose[dis][CLAIM_STAKE_A] = bal;
        } else {
            _stakePropose[dis][CLAIM_STAKE_B] = bal;
        }

        {
            _claimContent[dis] = con;
        }

        address use = msg.sender;

        unchecked {
            // Keep track of the number of disputes in this tree, so that we can
            // enforce a maximum amount of disputes on the given propose.
            {
                _claimDispute[pro]++;
            }

            // Set the given expiry to make the code flow below work.
            {
                uint256 dur = (((exp - block.timestamp) * durationBasis) / BASIS_TOTAL);

                if (dur > durationMax) {
                    _claimExpired[dis][CLAIM_EXPIRY_T] = exp - durationMax;
                } else if (dur < durationMin) {
                    _claimExpired[dis][CLAIM_EXPIRY_T] = exp - durationMin;
                } else {
                    _claimExpired[dis][CLAIM_EXPIRY_T] = exp - dur;
                }

                {
                    _claimExpired[dis][CLAIM_EXPIRY_P] = exp;
                }
            }

            // Account for the balance required in order to stake reputation
            // according to the requested amount. We try to prevent token
            // transfers if the available user balance is sufficient. Any tokens
            // missing will be requested from the configured token contract. The
            // caller then needs to provide an allowance that is able to cover
            // the difference transferred.
            uint256 avl = _availBalance[use];
            if (avl >= bal) {
                _availBalance[use] -= bal;
            } else {
                if (avl > 0) {
                    {
                        _availBalance[use] = 0;
                    }

                    if (!IERC20(token).transferFrom(use, address(this), (bal - avl))) {
                        revert Balance("transfer failed", (bal - avl));
                    }
                } else {
                    if (!IERC20(token).transferFrom(use, address(this), bal)) {
                        revert Balance("transfer failed", bal);
                    }
                }
            }

            // Track the user's allocated balance so we can tell people where
            // they stand any time. The allocated balances are all funds that
            // are currently bound in active markets. The user's available
            // balance does not change here because the user is directly staking
            // their deposited balance when participating in any given market.
            // The user's available balances may only increase later, if, and
            // only if a user is rewarded upon market resolution.
            {
                _allocBalance[use] += bal;
            }

            // Track the stakers expressed opinion by remembering the side they
            // picked using the boolean voting flag. True means the user agrees
            // with the given statement. False means the user disagrees
            // respectively. We do also account for the cumulative balances on
            // either side of the bet, so we can write this kind of data once
            // and read it for cheap many times later on when updating user
            // balances.
            if (vot) {
                {
                    _addressVotes[dis][use].set(VOTE_STAKE_Y);
                    _stakePropose[dis][CLAIM_STAKE_Y] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[dis][use][ADDRESS_STAKE_Y] + _addressStake[dis][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[dis][use][ADDRESS_STAKE_Y] = bal;
                    }

                    {
                        _indexAddress[dis][_indexMembers[dis][CLAIM_ADDRESS_Y]] = use;
                        _indexMembers[dis][CLAIM_ADDRESS_Y]++; // base is 0
                    }
                } else {
                    _addressStake[dis][use][ADDRESS_STAKE_Y] += bal;
                }
            } else {
                {
                    _addressVotes[dis][use].set(VOTE_STAKE_N);
                    _stakePropose[dis][CLAIM_STAKE_N] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[dis][use][ADDRESS_STAKE_Y] + _addressStake[dis][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[dis][use][ADDRESS_STAKE_N] = bal;
                    }

                    {
                        _indexMembers[dis][CLAIM_ADDRESS_N]--; // base is 2^256-1
                        _indexAddress[dis][_indexMembers[dis][CLAIM_ADDRESS_N]] = use;
                    }
                } else {
                    _addressStake[dis][use][ADDRESS_STAKE_N] += bal;
                }
            }
        }

        {
            emit DisputeCreated(dis, use, bal, exp);
        }
    }

    // createPropose may be called by anyone to propose a new claim, which means
    // to create a new market given a truth statement that can later be verified
    // by the community. The given claim ID "pro" must be unique. The caller
    // must own the given balance either as available balance inside this Claims
    // contract or as available balance inside the relevant token contract. The
    // given expiry must be at least 24 hours in the future.
    function createPropose(uint256 pro, uint256 bal, bool vot, uint64 exp, string memory con, address[] calldata tok)
        public
    {
        if (pro == 0) {
            revert Mapping("propose zero");
        }

        if (_claimExpired[pro][CLAIM_EXPIRY_P] != 0) {
            revert Mapping("propose invalid");
        }

        // Expiries must be at least 24 hours in the future.
        if (exp < block.timestamp + 24 hours) {
            revert Expired("too short", exp);
        }

        // We require every claim to provide at least 10,000 tokens in order to
        // create any given market. This limitation prevents certain accounting
        // issues. The lowest common amount of decimals for stablecoins is
        // USDC's 6 decimals, which means that 1 USDC equals 1,000,000 tokens.
        // Therefore 1 cent is the lowest amount possible in USDC denominated
        // terms.
        if (bal < BASIS_TOTAL) {
            revert Balance("too small", bal);
        }

        // In case this is the creation of a claim with lifecycle "propose",
        // store the first balance for the side of the stake as provided, so
        // that we can remember the minimum balance required for staking
        // reputation on this claim, while also being able to find the proposer
        // address without explicitly storing it.
        if (vot) {
            _stakePropose[pro][CLAIM_STAKE_A] = bal;
        } else {
            _stakePropose[pro][CLAIM_STAKE_B] = bal;
        }

        {
            _claimContent[pro] = con;
        }

        // If a token whitelist is provided, simply set it up for this claim.
        // The proposer does not need to own the whitelisted tokens in order to
        // propose the claim. That way whitelisted claims can be setup as a
        // service and the initial balance is valid as any other. The proposer
        // must still own whitelisted tokens in order to participate further
        // using updatePropose.
        if (tok.length != 0) {
            _proposeToken[pro] = tok;
        }

        address use = msg.sender;

        unchecked {
            // Set the given expiry to make the code flow below work.
            {
                uint256 dur = (((exp - block.timestamp) * durationBasis) / BASIS_TOTAL);

                if (dur > durationMax) {
                    _claimExpired[pro][CLAIM_EXPIRY_T] = exp - durationMax;
                } else if (dur < durationMin) {
                    _claimExpired[pro][CLAIM_EXPIRY_T] = exp - durationMin;
                } else {
                    _claimExpired[pro][CLAIM_EXPIRY_T] = exp - dur;
                }

                {
                    _claimExpired[pro][CLAIM_EXPIRY_P] = exp;
                }
            }

            // Account for the balance required in order to stake reputation
            // according to the requested amount. We try to prevent token
            // transfers if the available user balance is sufficient. Any tokens
            // missing will be requested from the configured token contract. The
            // caller then needs to provide an allowance that is able to cover
            // the difference transferred.
            uint256 avl = _availBalance[use];
            if (avl >= bal) {
                _availBalance[use] -= bal;
            } else {
                if (avl > 0) {
                    {
                        _availBalance[use] = 0;
                    }

                    if (!IERC20(token).transferFrom(use, address(this), (bal - avl))) {
                        revert Balance("transfer failed", (bal - avl));
                    }
                } else {
                    if (!IERC20(token).transferFrom(use, address(this), bal)) {
                        revert Balance("transfer failed", bal);
                    }
                }
            }

            // Track the user's allocated balance so we can tell people where
            // they stand any time. The allocated balances are all funds that
            // are currently bound in active markets. The user's available
            // balance does not change here because the user is directly staking
            // their deposited balance when participating in any given market.
            // The user's available balances may only increase later, if, and
            // only if a user is rewarded upon market resolution.
            {
                _allocBalance[use] += bal;
            }

            // Track the stakers expressed opinion by remembering the side they
            // picked using the boolean voting flag. True means the user agrees
            // with the given statement. False means the user disagrees
            // respectively. We do also account for the cumulative balances on
            // either side of the bet, so we can write this kind of data once
            // and read it for cheap many times later on when updating user
            // balances.
            if (vot) {
                {
                    _addressVotes[pro][use].set(VOTE_STAKE_Y);
                    _stakePropose[pro][CLAIM_STAKE_Y] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[pro][use][ADDRESS_STAKE_Y] + _addressStake[pro][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[pro][use][ADDRESS_STAKE_Y] = bal;
                    }

                    {
                        _indexAddress[pro][_indexMembers[pro][CLAIM_ADDRESS_Y]] = use;
                        _indexMembers[pro][CLAIM_ADDRESS_Y]++; // base is 0
                    }
                } else {
                    _addressStake[pro][use][ADDRESS_STAKE_Y] += bal;
                }
            } else {
                {
                    _addressVotes[pro][use].set(VOTE_STAKE_N);
                    _stakePropose[pro][CLAIM_STAKE_N] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[pro][use][ADDRESS_STAKE_Y] + _addressStake[pro][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[pro][use][ADDRESS_STAKE_N] = bal;
                    }

                    {
                        _indexMembers[pro][CLAIM_ADDRESS_N]--; // base is 2^256-1
                        _indexAddress[pro][_indexMembers[pro][CLAIM_ADDRESS_N]] = use;
                    }
                } else {
                    _addressStake[pro][use][ADDRESS_STAKE_N] += bal;
                }
            }
        }

        {
            emit ProposeCreated(pro, use, bal, exp);
        }
    }

    // updatePropose allows anyone to participate in any active market as long
    // as the minimum balance required can be provided. The given claim ID "pod"
    // may refer to claims of lifecycle phase "propose" or "dispute". The first
    // user staking on a new claim becomes the proposer, defining the minimum
    // balance required to participate in the new market. Proposer rewards may
    // apply upon market resolution.
    function updatePropose(uint256 pod, uint256 bal, bool vot, uint256 tok) public {
        address use = msg.sender;

        unchecked {
            // If there is a token whitelist setup, verify that the caller has a
            // non zero balance of the tokens that are required to participate
            // in this claim.
            if (_proposeToken[pod].length != 0 && IToken(_proposeToken[pod][tok]).balanceOf(use) == 0) {
                revert Balance("token missing", 0);
            }

            // Ensure that every staker provides at least the minimum balance
            // required in order to participate in this market.
            uint256 min = _stakePropose[pod][CLAIM_STAKE_A] + _stakePropose[pod][CLAIM_STAKE_B];
            if (bal < min) {
                revert Balance("below minimum", min);
            }

            // Ensure that the claim being staked on does in fact exist.
            // CLAIM_EXPIRY_P is the propose expiry. Only valid claims have a
            // valid expiry, and so if it is zero, then the given claim does not
            // exist.
            if (_claimExpired[pod][CLAIM_EXPIRY_P] == 0) {
                revert Mapping("claim invalid");
            }

            // Ensure anyone can stake up until the defined expiry threshold.
            if (_claimExpired[pod][CLAIM_EXPIRY_T] < block.timestamp) {
                revert Expired("staking over", _claimExpired[pod][CLAIM_EXPIRY_T]);
            }

            // Account for the balance required in order to stake reputation
            // according to the requested amount. We try to prevent token
            // transfers if the available user balance is sufficient. Any tokens
            // missing will be requested from the configured token contract. The
            // caller then needs to provide an allowance that is able to cover
            // the difference transferred.
            uint256 avl = _availBalance[use];
            if (avl >= bal) {
                _availBalance[use] -= bal;
            } else {
                if (avl > 0) {
                    {
                        _availBalance[use] = 0;
                    }

                    if (!IERC20(token).transferFrom(use, address(this), (bal - avl))) {
                        revert Balance("transfer failed", (bal - avl));
                    }
                } else {
                    if (!IERC20(token).transferFrom(use, address(this), bal)) {
                        revert Balance("transfer failed", bal);
                    }
                }
            }

            // Track the user's allocated balance so we can tell people where
            // they stand any time. The allocated balances are all funds that
            // are currently bound in active markets. The user's available
            // balance does not change here because the user is directly staking
            // their deposited balance when participating in any given market.
            // The user's available balances may only increase later, if, and
            // only if a user is rewarded upon market resolution.
            {
                _allocBalance[use] += bal;
            }

            // Track the stakers expressed opinion by remembering the side they
            // picked using the boolean voting flag. True means the user agrees
            // with the given statement. False means the user disagrees
            // respectively. We do also account for the cumulative balances on
            // either side of the bet, so we can write this kind of data once
            // and read it for cheap many times later on when updating user
            // balances.
            if (vot) {
                {
                    _addressVotes[pod][use].set(VOTE_STAKE_Y);
                    _stakePropose[pod][CLAIM_STAKE_Y] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[pod][use][ADDRESS_STAKE_Y] + _addressStake[pod][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[pod][use][ADDRESS_STAKE_Y] = bal;
                    }

                    {
                        _indexAddress[pod][_indexMembers[pod][CLAIM_ADDRESS_Y]] = use;
                        _indexMembers[pod][CLAIM_ADDRESS_Y]++; // base is 0
                    }
                } else {
                    _addressStake[pod][use][ADDRESS_STAKE_Y] += bal;
                }
            } else {
                {
                    _addressVotes[pod][use].set(VOTE_STAKE_N);
                    _stakePropose[pod][CLAIM_STAKE_N] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[pod][use][ADDRESS_STAKE_Y] + _addressStake[pod][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[pod][use][ADDRESS_STAKE_N] = bal;
                    }

                    {
                        _indexMembers[pod][CLAIM_ADDRESS_N]--; // base is 2^256-1
                        _indexAddress[pod][_indexMembers[pod][CLAIM_ADDRESS_N]] = use;
                    }
                } else {
                    _addressStake[pod][use][ADDRESS_STAKE_N] += bal;
                }
            }
        }

        {
            emit ClaimUpdated(pod, use, bal);
        }
    }

    // updateBalance allows anyone to effectively distribute staked reputation
    // according to the resolution of the underlying market provided by the
    // claim ID "pod". This claim ID might be the ID of a propose or dispute.
    // Every undisputed propose can be finalized using updateBalance after its
    // own challenge window expired. Since every dispute is just another claim,
    // their respective challenge windows must expire too, before any balances
    // can be updated. In a tree of claims, the outcome of the last dispute is
    // effectively applied to all claims in that tree. For markets with large
    // amounts of participants, updateBalance may be called multiple times using
    // "max" as the maximum amount of users processed at a time. "max" must not
    // be zero. updateBalance can be iteratively called until searchResolve
    // returns true when being called with CLAIM_BALANCE_S.
    //
    //     updateBalance(33, 5)
    //
    //     searchResolve(33, CLAIM_BALANCE_S) => false
    //
    //     updateBalance(33, 5)
    //
    //     searchResolve(33, CLAIM_BALANCE_S) => false
    //
    //     updateBalance(33, 5)
    //
    //     searchResolve(33, CLAIM_BALANCE_S) => true
    //
    function updateBalance(uint256 pod, uint256 max) public {
        if (_claimBalance[pod].get(CLAIM_BALANCE_S)) {
            revert Process("already settled");
        }

        if (max == 0) {
            revert Mapping("max invalid");
        }

        // If there is no claim mapping for the given claim ID, then there is no
        // dispute recorded that we would have to account for otherwise. If we
        // have a valid dispute ID mapped to the given claim ID, then we need to
        // account for the latest dispute. Below we try to point to the latest
        // claim in any given tree, while finding the amount of claims within
        // that tree. On top of that we need to figure out whether pod is of
        // lifecycle phase "propose" or "dispute", so that we can emit events
        // accordingly. We will set "kin" to 0 if we update balances for a
        // propose, and we will set "kin" to 1 if we update balances for a
        // dispute.
        (uint8 kin, uint256 lat, uint256 len) = searchLatest(pod);

        {
            uint256 exp = _claimExpired[lat][CLAIM_EXPIRY_R];

            // Ensure that any resolution, whether it is the resolution of a
            // propose or dispute, can conclude in their own right, before we
            // allow for updating any balances.
            if (exp == 0 || exp > block.timestamp) {
                revert Expired("resolve active", exp);
            }

            // Any claim of lifecycle phase "resolve" can be challenged. Only
            // after the resolving claim expired, AND only after some designated
            // challenge period passed on top of the claim's expiry, only then
            // can a claim be finalized and user balances be updated.
            //
            // Similar to challenging the outcomes of the original claims with
            // lifecycle phase "propose", disputes may also be challenged.
            // Therefore we apply challenge periods to all disputes, except the
            // last ones. Once the maximum amount of disputes has been reached,
            // the final dispute is definitive and binding, meaning balances can
            // be updated immediately after the final dispute resolved.
            if (exp + 7 days > block.timestamp && len < 2) {
                revert Expired("challenge active", exp + 7 days);
            }
        }

        // Lookup the amounts of votes that we have recorded on either side. It
        // may very well be that there are no votes or that we have a tied
        // result. In those undesired cases, we punish those users who where
        // selected by the random truth sampling process, simply by taking all
        // of their staked balances away. If lat is just an undisputed propose,
        // then we refer to its own resolution. If lat on the other hand is the
        // latest dispute of a tree, then we overwrite the resolution of every
        // claim in the given tree with the outcome of the latest dispute.
        uint256 yay;
        uint256 nah;
        {
            yay = _truthResolve[lat][CLAIM_TRUTH_Y];
            nah = _truthResolve[lat][CLAIM_TRUTH_N];
        }

        // We are processing user balances one by one, on a circle of the
        // numerical sequence that is underlying our address indices. We go from
        // left to right, overflowing the max uint in the process. Here lef is
        // the latest first time staker in disagreement with the associated
        // claim, and rig is the latest first time staker in agreement on the
        // other side of the market. Also account for any addresses that we
        // already processed, by moving the left most pointer further to the
        // right.
        uint256 all;
        uint256 dis = _stakePropose[pod][CLAIM_STAKE_D];
        uint256 lef = _indexMembers[pod][CLAIM_ADDRESS_N];
        uint256 rig = _indexMembers[pod][CLAIM_ADDRESS_Y];
        unchecked {
            // Ensure that our basis for calculating the delta on the negative
            // spectrum is always at least max uint. If a claim has no false
            // stakers, then lef is 0, which means we have to turn it into a max
            // uint in order to get a delta of 0.
            {
                lef--;
            }

            // We calculate the number of all market participants by summing the
            // positive amount of all true stakers with the delta between max
            // uint and the negative amount of all false stakers. This works in
            // all cases because lef got decremented above, causing a potential
            // underflow.
            {
                all = rig + (MAX_UINT256 - lef);
            }

            // Since we decremented by 1 above in order to make the subtraction
            // work with max uint, we have to add 1 again in order to account
            // for all stakers that we already processed. Below lef will be used
            // to continue updating balances, where lef points to the next user
            // to be processed.
            {
                lef += dis + 1;
            }
        }

        {
            emit BalanceUpdated(pod);
        }

        uint256 toy = _stakePropose[pod][CLAIM_STAKE_Y];
        uint256 ton = _stakePropose[pod][CLAIM_STAKE_N];
        bool inv = yay == nah;
        bool sid = yay > nah;

        if (all == 1) {
            if (inv) {
                punishOne(pod);
            } else {
                rewardOne(pod, sid);
            }

            if (kin == 0) {
                emit ProposeSettled(pod, all, yay, nah, toy + ton);
            } else {
                emit DisputeSettled(pod, all, yay, nah, toy + ton);
            }
        } else {
            if (inv) {
                dis = punishAll(pod, dis, lef, rig, max);
            } else {
                dis = rewardAll(pod, dis, lef, rig, max, toy, ton, sid);
            }

            // Only credit the proposer and the protocol once everyone else got
            // accounted for.
            if (dis == all) {
                finishAll(pod, kin, all, yay, nah, toy, ton, toy + ton, inv, sid);
            } else {
                _stakePropose[pod][CLAIM_STAKE_D] = dis;
            }
        }
    }

    // withdraw allows anyone to withdraw their own available balance as
    // distributed by this smart contract.
    function withdraw(uint256 bal) public {
        address use = msg.sender;

        // The arithmetic below is intentionally defined outside of an
        // "unchecked" block, so that anyone trying to withdraw more than they
        // are owed causes their own transaction to revert with a panic.
        {
            _availBalance[use] -= bal;
        }

        if (!IERC20(token).transfer(use, bal)) {
            revert Balance("transfer failed", bal);
        }
    }

    //
    // PUBLIC PRIVILEGED
    //

    // createResolve must be called by the privileged BOT_ROLE in order to
    // initiate the random truth sampling process onchain.
    function createResolve(uint256 pod, uint256[] calldata ind, uint64 exp) public {
        // Inlining the role check instead of using the modifier saves about 140
        // gas per call.
        if (!hasRole(BOT_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, BOT_ROLE);
        }

        uint256 cep = _claimExpired[pod][CLAIM_EXPIRY_P];

        if (cep == 0) {
            revert Mapping("propose invalid");
        }

        if (_claimExpired[pod][CLAIM_EXPIRY_R] != 0) {
            revert Mapping("claim overwrite");
        }

        if (cep > block.timestamp) {
            revert Expired("propose active", cep);
        }

        if (ind.length == 0) {
            revert Mapping("indices invalid");
        }

        // Expiries must be at least 24 hours in the future.
        if (exp < block.timestamp + 24 hours) {
            revert Expired("expiry invalid", exp);
        }

        uint256 yay;
        uint256 nah;
        for (uint256 i = 0; i < ind.length; i++) {
            address use = _indexAddress[pod][ind[i]];

            // We we ended up with the zero address it means the provided index
            // is out of range and the random truth sampling process failed to
            // come up with a list of valid indices.
            if (use == address(0)) {
                revert Mapping("zero address");
            }

            // If for any reason the random truth sampling process provides us
            // with the same index twice, then we revert the whole transaction.
            // The rule is "one user one vote".
            if (_addressVotes[pod][use].get(VOTE_TRUTH_S)) {
                revert Mapping("already selected");
            }

            {
                _addressVotes[pod][use].set(VOTE_TRUTH_S);
            }

            // Keep track of the amounts of votes recorded on either side of the
            // market.
            if (ind[i] < MID_UINT256) {
                yay++;
            } else {
                nah++;
            }
        }

        // For every claim with more than 1 user we have to ensure that an equal
        // amount of voters is being selected by the random truth sampling
        // process. Since this process works on the basis of "one user one
        // vote", we revert here if the market resolution is not setup fairly.
        // It is important to allow an equal amount of users verify events in
        // the real world because a single honest vote can make all the
        // difference if everyone else is selfish.
        if (ind.length > 1 && yay != nah) {
            revert Mapping("indices invalid");
        }

        {
            _claimExpired[pod][CLAIM_EXPIRY_R] = exp;
            _claimIndices[pod] = ind;
        }

        {
            emit ResolveCreated(pod, msg.sender, ind.length, exp);
        }
    }

    // updateDuration allows the owner to change the global staking cliff
    // applied to all active and upcoming claims. "bas" cannot be more than 50%,
    // which means that the end of a staking expiry of 10 days cannot be
    // shortened to more than 5 days. "max" and "min" may be set to any
    // reasonable amount of seconds.
    function updateDuration(uint64 bas, uint64 max, uint64 min) public {
        // Inlining the role check instead of using the modifier saves about 140
        // gas per call.
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, DEFAULT_ADMIN_ROLE);
        }

        if (bas == 0 || bas > 5_000) {
            revert Process("duration invalid");
        }

        {
            durationBasis = bas;
            durationMax = max;
            durationMin = min;
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

    // updateResolve allows any whitelisted user to verify the truth with
    // respect to the associated claim. Whitelisting happens through the process
    // of random truth sampling, where an equal number of agreeing and
    // disagreeing users is selected to verify events as happened in the real
    // world on behalf of all market participants. All voting happens on a "one
    // user one vote" basis.
    function updateResolve(uint256 pod, bool vot) public {
        uint256 exp = _claimExpired[pod][CLAIM_EXPIRY_R];

        if (exp == 0) {
            revert Mapping("propose invalid");
        }

        if (exp < block.timestamp) {
            revert Expired("resolve expired", exp);
        }

        address use = msg.sender;

        if (!_addressVotes[pod][use].get(VOTE_TRUTH_S)) {
            revert Address("not allowed");
        }

        if (_addressVotes[pod][use].get(VOTE_TRUTH_V)) {
            revert Address("already voted");
        }

        if (vot) {
            _addressVotes[pod][use].set(VOTE_TRUTH_Y);
            _truthResolve[pod][CLAIM_TRUTH_Y]++;
        } else {
            _addressVotes[pod][use].set(VOTE_TRUTH_N);
            _truthResolve[pod][CLAIM_TRUTH_N]++;
        }

        {
            _addressVotes[pod][use].set(VOTE_TRUTH_V);
        }
    }

    //
    // PRIVATE
    //

    // finishAll is the final stage to settle claims with more than 1
    // participating user.
    function finishAll(
        uint256 pod,
        uint8 kin,
        uint256 all,
        uint256 yay,
        uint256 nah,
        uint256 toy,
        uint256 ton,
        uint256 tot,
        bool inv,
        bool sid
    ) private {
        unchecked {
            if (inv) {
                _availBalance[owner] += tot - _stakePropose[pod][CLAIM_STAKE_C];
            } else {
                address first;
                if (_stakePropose[pod][CLAIM_STAKE_A] == 0) {
                    first = _indexAddress[pod][MAX_UINT256];
                } else {
                    first = _indexAddress[pod][0];
                }

                // Fees are only applied if there are rewards on the other side
                // that we can distribute.
                if (sid) {
                    if (ton != 0) {
                        uint256 share = (ton * BASIS_PROPOSER) / BASIS_TOTAL;
                        _availBalance[first] += share;
                        _availBalance[owner] += ton - (share + _stakePropose[pod][CLAIM_STAKE_C]);
                    }
                } else {
                    if (toy != 0) {
                        uint256 share = (toy * BASIS_PROPOSER) / BASIS_TOTAL;
                        _availBalance[first] += share;
                        _availBalance[owner] += toy - (share + _stakePropose[pod][CLAIM_STAKE_C]);
                    }
                }

                {
                    _claimBalance[pod].set(CLAIM_BALANCE_V);
                }
            }

            {
                delete _stakePropose[pod][CLAIM_STAKE_C];
                delete _stakePropose[pod][CLAIM_STAKE_D];
            }

            {
                _claimBalance[pod].set(CLAIM_BALANCE_S);
            }

            if (kin == 0) {
                emit ProposeSettled(pod, all, yay, nah, tot);
            } else {
                emit DisputeSettled(pod, all, yay, nah, tot);
            }
        }
    }

    // punishAll ensures that invalid market resolutions are accounted for
    // properly by punishing voters and reimbursing stakers after fees.
    function punishAll(uint256 pod, uint256 dis, uint256 lef, uint256 rig, uint256 max) private returns (uint256) {
        unchecked {
            while (max != 0) {
                address use = _indexAddress[pod][lef];
                uint256 bal = _addressStake[pod][use][ADDRESS_STAKE_Y] + _addressStake[pod][use][ADDRESS_STAKE_N];

                // Every user loses their allocated balance when claims get
                // resolved. Only those users who were right in the end regain
                // their allocated balances in the form of available balances,
                // plus rewards.
                {
                    _allocBalance[use] -= bal;
                }

                // The punishment case deducts fees in order to ensure that
                // everyone loses money if consensus could not be achieved. This
                // is an incentive to A) try harder to achieve consensus, and B)
                // be more diligent in the individual choice of participating in
                // markets.
                uint256 ded = (bal * BASIS_FEE) / BASIS_TOTAL;

                // Since this is the punishment case of resolving claims, every
                // user who was selected by the random truth sampling process
                // loses all of their staked balance. In this particular failure
                // scenario, the protocol receives all funds taken from the
                // users that the random truth sampling process selected. As a
                // reminder, this punishment happens because the selected users
                // did either not come to consensus according to events in the
                // real world, or did not do at all what they have been asked
                // for.
                if (_addressVotes[pod][use].get(VOTE_TRUTH_S)) {
                    _availBalance[owner] += ded;
                } else {
                    _availBalance[use] += ded;
                }

                {
                    _stakePropose[pod][CLAIM_STAKE_C] += ded;
                }

                {
                    dis++;
                    lef++;
                    max--;
                }

                if (lef == rig) {
                    break;
                }
            }
        }

        return dis;
    }

    // punishOne settles claims for wich the only participating user did either
    // not vote or confirmed that their prior opinion was wrong. This is a
    // separate function because the protocol owner becomes automatically the
    // contender if there is only a single market participant.
    function punishOne(uint256 pod) private {
        unchecked {
            address use;
            if (_stakePropose[pod][CLAIM_STAKE_A] == 0) {
                use = _indexAddress[pod][MAX_UINT256];
            } else {
                use = _indexAddress[pod][0];
            }

            uint256 bal = _addressStake[pod][use][ADDRESS_STAKE_Y] + _addressStake[pod][use][ADDRESS_STAKE_N];

            {
                _allocBalance[use] -= bal;
                _availBalance[owner] += bal;
            }

            {
                _claimBalance[pod].set(CLAIM_BALANCE_S);
            }
        }
    }

    // rewardAll processes user balances in order to settle any claim in which
    // many users participated.
    function rewardAll(
        uint256 pod,
        uint256 dis,
        uint256 lef,
        uint256 rig,
        uint256 max,
        uint256 toy,
        uint256 ton,
        bool sid
    ) private returns (uint256) {
        unchecked {
            while (max != 0) {
                address use = _indexAddress[pod][lef];

                uint256 sty = _addressStake[pod][use][ADDRESS_STAKE_Y];
                uint256 stn = _addressStake[pod][use][ADDRESS_STAKE_N];

                // Every user loses their allocated balance when claims get
                // resolved. Only those users who were right in the end regain
                // their allocated balances in the form of available balances,
                // plus rewards.
                {
                    _allocBalance[use] -= sty + stn;
                }

                if (sid) {
                    if (_addressVotes[pod][use].get(VOTE_STAKE_Y)) {
                        if (ton == 0) {
                            // If the true side wins, but there is nobody on the
                            // false side, then everybody on the true side gets
                            // only their money back.
                            _availBalance[use] += sty;
                        } else {
                            uint256 ded = (ton * BASIS_FEE) / BASIS_TOTAL;
                            uint256 shr = (sty * 1e18) / toy;
                            uint256 rew = (shr * ded) / 1e18;

                            // If the true side wins and there is somebody else
                            // on the false side, then everybody on the true
                            // side gets their money back, plus the captured
                            // reward from the false side, proportional to the
                            // respective share on the true side.
                            _availBalance[use] += sty + rew;
                            _stakePropose[pod][CLAIM_STAKE_C] += rew;
                        }
                    }
                } else {
                    if (_addressVotes[pod][use].get(VOTE_STAKE_N)) {
                        if (toy == 0) {
                            // If the false side wins, but there is nobody on
                            // the true side, then everybody on the false side
                            // gets only their money back.
                            _availBalance[use] += stn;
                        } else {
                            uint256 ded = (toy * BASIS_FEE) / BASIS_TOTAL;
                            uint256 shr = (stn * 1e18) / ton;
                            uint256 rew = (shr * ded) / 1e18;

                            // If the false side wins and there is somebody else
                            // on the true side, then everybody on the false
                            // side gets their money back, plus the captured
                            // reward from the true side, proportional to the
                            // respective share on the false side.
                            _availBalance[use] += stn + rew;
                            _stakePropose[pod][CLAIM_STAKE_C] += rew;
                        }
                    }
                }

                {
                    dis++;
                    lef++;
                    max--;
                }

                if (lef == rig) {
                    break;
                }
            }
        }

        return dis;
    }

    // rewardOne finalizes any claim for which there was one participating user
    // that was found to be right by consensus. This is a separate function
    // because the protocol owner becomes automatically the contender if there
    // is only a single market participant.
    function rewardOne(uint256 pod, bool sid) private {
        unchecked {
            address use;
            if (_stakePropose[pod][CLAIM_STAKE_A] == 0) {
                use = _indexAddress[pod][MAX_UINT256];
            } else {
                use = _indexAddress[pod][0];
            }

            uint256 sty = _addressStake[pod][use][ADDRESS_STAKE_Y];
            uint256 stn = _addressStake[pod][use][ADDRESS_STAKE_N];

            uint256 bal = sty + stn;

            {
                _allocBalance[use] -= bal;
            }

            if (sid) {
                if (_addressVotes[pod][use].get(VOTE_STAKE_Y)) {
                    {
                        _availBalance[use] += sty;
                    }

                    if (stn != 0) {
                        _availBalance[owner] += stn;
                    }
                } else {
                    _availBalance[owner] += bal;
                }
            } else {
                if (_addressVotes[pod][use].get(VOTE_STAKE_N)) {
                    {
                        _availBalance[use] += stn;
                    }

                    if (sty != 0) {
                        _availBalance[owner] += sty;
                    }
                } else {
                    _availBalance[owner] += bal;
                }
            }

            {
                _claimBalance[pod].set(CLAIM_BALANCE_V);
                _claimBalance[pod].set(CLAIM_BALANCE_S);
            }
        }
    }

    //
    // PUBLIC VIEW
    //

    // searchBalance allows anyone to search for the allocated and available
    // balances of any user. The allocated user balance represents all funds
    // currently staked. Those funds are bound until the respective market
    // resolution distributes them accordingly. Allocated balances grow by
    // staking reputation. The available user balance represents all funds
    // distributed to users who have been found right after final market
    // resolution. Those funds are won because somebody else was wrong in their
    // opinion. Available balances grow by being right. Only available balances
    // can be withdrawn any time.
    //
    //     out[0] the allocated user balance
    //     out[1] the available user balance
    //
    function searchBalance(address use) public view returns (uint256, uint256) {
        return (_allocBalance[use], _availBalance[use]);
    }

    // searchContent allows anyone to lookup the given claim's content
    // reference, which may point to external offchain or onchain resources
    // associated with the given claim.
    function searchContent(uint256 pod) public view returns (string memory) {
        return _claimContent[pod];
    }

    // searchExpired returns the unix timestamp in seconds of the given claim's
    // expiries. For instance the propose expiry ensures that any user may stake
    // reputation on the associated claim as long as said expiry has not run
    // out. Only after the expiration of a propose expiry is it possible to
    // initiate the market resolution, which allows users to verify events in
    // the real world. Verifying the truth in those resolve claims is then only
    // possible as long as the resolve expiry has not run out.
    //
    //     out[0] the propose expiry
    //     out[0] the resolve expiry
    //
    function searchExpired(uint256 pod) public view returns (uint256, uint256) {
        return (_claimExpired[pod][CLAIM_EXPIRY_P], _claimExpired[pod][CLAIM_EXPIRY_R]);
    }

    // searchHistory returns historical balance changes of all market
    // participants using the same iterator pattern searchStakers. That means
    // searchHistory works with the same indices as provided by searchIndices.
    // Using searchStakers and searchHistory with the same indices enables the
    // caller to understand market specific user balances before and after
    // settlement. The returned balances are structured in touples of 5 as shown
    // below, e.g. if searching user addresses using searchStakers were to
    // return 5 addresses, then searchHistory would return 25 numbers, that is 5
    // tuples of 5 balances, using the same indices as provided by
    // searchIndices.
    //
    //     [        before        |         after        |   ]
    //
    //     "agreement,disagreement,agreement,disagreement,fee"
    //
    function searchHistory(uint256 pod, uint256 lef, uint256 rig) public view returns (uint256[] memory) {
        uint256[] memory lis = new uint256[](((rig - lef) + 1) * 5);

        address fir;
        if (_stakePropose[pod][CLAIM_STAKE_A] == 0) {
            fir = _indexAddress[pod][MAX_UINT256];
        } else {
            fir = _indexAddress[pod][0];
        }

        (bool one, bool val, bool sid) = searchResults(pod);

        uint256 toy = _stakePropose[pod][CLAIM_STAKE_Y];
        uint256 ton = _stakePropose[pod][CLAIM_STAKE_N];

        uint256 i = 0;
        uint256 j = lef;
        while (j <= rig) {
            address use = _indexAddress[pod][j];

            if (use == address(0)) {
                break;
            }

            uint256 sty = _addressStake[pod][use][ADDRESS_STAKE_Y];
            uint256 stn = _addressStake[pod][use][ADDRESS_STAKE_N];

            // The "before" state of staker balances is always the same.
            {
                lis[i] = sty;
                lis[i + 1] = stn;
                lis[i + 2] = 0;
                lis[i + 3] = 0;
                lis[i + 4] = 0;
            }

            if (one) {
                if (val) {
                    if (sid) {
                        if (_addressVotes[pod][use].get(VOTE_STAKE_Y)) {
                            lis[i + 2] = sty;
                        }
                    } else {
                        if (_addressVotes[pod][use].get(VOTE_STAKE_N)) {
                            lis[i + 3] = stn;
                        }
                    }
                }
            } else {
                if (val) {
                    if (sid) {
                        if (_addressVotes[pod][use].get(VOTE_STAKE_Y)) {
                            if (ton == 0) {
                                lis[i + 2] = sty;
                            } else {
                                uint256 ded = (ton * BASIS_FEE) / BASIS_TOTAL;
                                uint256 shr = (sty * 1e18) / toy;
                                uint256 rew = (shr * ded) / 1e18;

                                lis[i + 2] = sty + rew;
                            }
                        }

                        if (ton != 0 && use == fir) {
                            lis[i + 4] = (ton * BASIS_PROPOSER) / BASIS_TOTAL;
                        }
                    } else {
                        if (_addressVotes[pod][use].get(VOTE_STAKE_N)) {
                            if (toy == 0) {
                                lis[i + 3] = stn;
                            } else {
                                uint256 ded = (toy * BASIS_FEE) / BASIS_TOTAL;
                                uint256 shr = (stn * 1e18) / ton;
                                uint256 rew = (shr * ded) / 1e18;

                                lis[i + 3] = stn + rew;
                            }
                        }

                        if (toy != 0 && use == fir) {
                            lis[i + 4] = (toy * BASIS_PROPOSER) / BASIS_TOTAL;
                        }
                    }
                } else {
                    if (!_addressVotes[pod][use].get(VOTE_TRUTH_S)) {
                        if (sty != 0) {
                            lis[i + 2] = (sty * BASIS_FEE) / BASIS_TOTAL;
                        }

                        if (stn != 0) {
                            lis[i + 3] = (stn * BASIS_FEE) / BASIS_TOTAL;
                        }
                    }
                }
            }

            {
                i += 5;
            }

            if (j == MAX_UINT256) {
                break;
            }

            {
                j++;
            }
        }

        // Resize the array to remove any initially allocated zero address.
        assembly {
            mstore(lis, i)
        }

        return lis;
    }

    // searchIndices allows anyone to search for the addresses of staker and
    // voter indices of any given claim. The provided claim ID must be the ID of
    // the claim with lifecycle "propose". See the examples below.
    //
    //     out[0] the total amount of first stakers in agreement
    //     out[1] the left handside index for addresses on the agreeing side
    //     out[2] the right handside index for addresses on the agreeing side
    //     out[3] the left handside index of the proposer address
    //     out[4] the right handside index of the proposer address
    //     out[5] the left handside index for addresses on the disagreeing side
    //     out[6] the right handside index for addresses on the disagreeing side
    //     out[7] the total amount of first stakers in disagreement
    //
    // Search for the proposer address.
    //
    //     searchStakers(CLAIM, out[3], out[4])
    //
    // Search for all addresses having first staked in aggrement.
    //
    //     searchStakers(CLAIM, out[1], out[2])
    //
    // Search for all addresses having first staked in disaggrement.
    //
    //     searchStakers(CLAIM, out[5], out[6])
    //
    // Search for all addresses selected to vote for the agreeing side.
    //
    //     searchSamples(CLAIM, out[1], out[2])
    //
    // Search for all addresses selected to vote for the disagreeing side.
    //
    //     searchSamples(CLAIM, out[5], out[6])
    //
    function searchIndices(uint256 pod)
        public
        view
        returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)
    {
        uint256 toy = _indexMembers[pod][CLAIM_ADDRESS_Y];
        uint256 ley = 0;
        uint256 riy = toy;

        if (toy > 0) {
            riy--;
        }

        uint256 len = _indexMembers[pod][CLAIM_ADDRESS_N];
        uint256 ton;
        uint256 rin = MAX_UINT256;

        unchecked {
            if (len == 0) {
                len--;
                ton = (MAX_UINT256 - len);
            } else {
                ton = (MAX_UINT256 - len) + 1;
            }
        }

        return (toy, ley, riy, MID_UINT256, MID_UINT256, len, rin, ton);
    }

    // searchLatest provides structural insights into the claim tree of which
    // "pod" is part of. "pod" is the claim ID of either a propose or dispute.
    //
    //     inp[0] the propose or dispute of any given claim tree
    //     out[0] the actual type of "pod", 0 for propose, 1 for dispute
    //     out[1] the latest claim ID in the given tree
    //     out[2] the amount of disputes in the given tree
    //
    function searchLatest(uint256 pod) public view returns (uint8, uint256, uint256) {
        //
        //     pod = 1 || 101 || 102
        //     lat = 0 || 1 || 102
        //     len = 0 || 2
        //
        uint8 kin;
        uint256 lat = _claimMapping[pod];
        uint256 len;
        if (lat == 0) {
            // pod = 1
            // lat = 0
            // len = 0
            lat = pod;
        } else {
            // pod = 1 || 101 || 102
            // lat = 1 || 102
            // len = 0 || 2
            len = _claimDispute[lat];
            if (len != 0) {
                // pod = 102
                // lat = 1
                // len = 2
                kin = 1;
                lat = pod;
            } else {
                // pod = 1 || 101
                // lat = 102
                // len = 0 || 2
                len = _claimDispute[pod];
                if (len == 0) {
                    // pod = 101
                    // lat = 102
                    // len = 0
                    kin = 1;
                    len = _claimDispute[_claimMapping[lat]];
                }
                // else
                // pod = 1
                // lat = 102
                // len = 2
            }
        }

        return (kin, lat, len);
    }

    // searchPropose can be called by anyone to lookup the amount of tokens
    // staked on either side of any given market. Additionally, the minimum
    // stake required in order to participate in the given market is also
    // returned.
    //
    //     out[0] the amount of reputation staked in agreement
    //     out[1] the minimum amount of stake required to participate
    //     out[2] the amount of reputation staked in disagreement
    //
    function searchPropose(uint256 pod) public view returns (uint256, uint256, uint256) {
        return (
            _stakePropose[pod][CLAIM_STAKE_Y],
            _stakePropose[pod][CLAIM_STAKE_A] + _stakePropose[pod][CLAIM_STAKE_B],
            _stakePropose[pod][CLAIM_STAKE_N]
        );
    }

    // searchResolve can be called by anyone to check for the current claim
    // status. The first parameter "pod" must be the ID of a claim with
    // lifecycle phase "dispute" or "propose". The second parameter "ind" must
    // be one of the following available indices.
    //
    //     CLAIM_BALANCE_V to check whether the given claim settled with a valid resolution
    //
    //     CLAIM_BALANCE_S to check whether the given claim settled by updating user balances
    //
    // The example call below shows whether propose 33 concluded by returning
    // either true or false. Once true is returned, claim 33 will be finalized
    // and cannot be modified anymore. That also means claim 33 cannot be
    // disputed anymore, since its resolution has become definitive and binding.
    //
    //     searchResolve(33, CLAIM_BALANCE_S)
    //
    function searchResolve(uint256 pod, uint8 ind) public view returns (bool) {
        return _claimBalance[pod].get(ind);
    }

    // searchResults returns some structural insights that have been relevant to
    // reconciling any given claim towards settlement.
    //
    //     inp[0] the propose or dispute to lookup
    //     out[0] whether the given claim had only a single market participant
    //     out[1] whether the market resolution was valid
    //     out[2] the side of the market used for settlement
    //
    function searchResults(uint256 pod) public view returns (bool, bool, bool) {
        bool one = false;
        {
            (uint256 nsy,,,,,,, uint256 nsn) = searchIndices(pod);
            if (nsy + nsn == 1) {
                one = true;
            }
        }

        bool val = searchResolve(pod, CLAIM_BALANCE_V);

        bool sid = false;
        {
            (, uint256 lat,) = searchLatest(pod);
            (uint256 yay, uint256 nah) = searchVotes(lat);
            if (yay > nah) {
                sid = true;
            }
        }

        return (one, val, sid);
    }

    // searchSamples provides the results of the random truth sampling process
    // in conjunction with the indices provided by searchIndices. Anyone can
    // lookup the voter addresses of either side of any given market. Voting
    // addresses are indexed based on the order of indices provided during the
    // contract write of createResolve. The boundaries lef and rig are both
    // inclusive. Below is an example of searching for all 2 voters on the
    // agreeing side of the market.
    //
    //     searchSamples(CLAIM, 0, 2) => [Address(2)]
    //     searchSamples(CLAIM, 3, 5) => []
    //     searchSamples(CLAIM, 6, 8) => [Address(7)]
    //
    // The same result as above can be achieved in a single call as shown below.
    // The right handside boundary is only matched against the actual voter
    // indices.
    //
    //     searchSamples(CLAIM, 0, 100) => [Address(2), Address(7)]
    //
    // If the voters to be searched were all on the other side of the market,
    // meaning all voters would have staked in disagreement before, then the
    // list of addresses returned would be reversed.
    //
    //     searchSamples(CLAIM, 2^256-8, 2^256-1) => [Address(7), Address(2)]
    //
    function searchSamples(uint256 pod, uint256 lef, uint256 rig) public view returns (address[] memory) {
        address[] memory lis = new address[](rig - lef + 1);

        uint256 i = 0;
        uint256 j = 0;
        while (i < lis.length && j < _claimIndices[pod].length) {
            // Go through each of the recorded indices, one after another. Those
            // indices are not guaranteed to be ordered.
            //
            //     [ 3 0 96 4 99 95 1 97 2 98 ]
            //
            uint256 ind = _claimIndices[pod][j];

            {
                j++;
            }

            // Skip all those indices that the query defined by lef and rig is
            // not interested in. If we are look for indices on one end of the
            // sequence, ignore those indexed on the other side.
            //
            //     [ < 0 1 2 3 4 > ... < 95 96 97 98 99 > ]
            //
            if (ind < lef || ind > rig) {
                continue;
            }

            {
                lis[i] = _indexAddress[pod][ind];
            }

            {
                i++;
            }
        }

        // Resize the array to remove any initially allocated zero address.
        assembly {
            mstore(lis, i)
        }

        return lis;
    }

    // searchStakers works in conjunction with the indices provided by
    // searchIndices. Anyone can lookup the staker addresses of either side of
    // any given market. Staker addresses are indexed based on the order and
    // side on which they staked first. The boundaries lef and rig are both
    // inclusive. Below is an example of searching for all 8 stakers that agree
    // with the associated claim.
    //
    //     searchStakers(CLAIM, 0, 2) => [Address(1), Address(2), Address(3)]
    //     searchStakers(CLAIM, 3, 5) => [Address(4), Address(5), Address(6)]
    //     searchStakers(CLAIM, 6, 8) => [Address(7), Address(8)]
    //
    // The same result as above can be achieved in a single call as shown below.
    // The right handside boundary is only applied until a zero address is found.
    //
    //     searchStakers(CLAIM, 0, 100) => [
    //         Address(1), Address(2), Address(3), Address(4),
    //         Address(5), Address(6), Address(7), Address(8)
    //     ]
    //
    // If the stakers to be searched were all on the other side of the market,
    // meaning all stakers would be disagreeing with the associated claim, then
    // the list of addresses returned would be reversed.
    //
    //     searchStakers(CLAIM, 2^256-8, 2^256-1) => [
    //         Address(8), Address(7), Address(6), Address(5),
    //         Address(4), Address(3), Address(2), Address(1)
    //     ]
    //
    function searchStakers(uint256 pod, uint256 lef, uint256 rig) public view returns (address[] memory) {
        address[] memory lis = new address[](rig - lef + 1);

        if (lef == MID_UINT256 && rig == MID_UINT256) {
            address use;
            if (_stakePropose[pod][CLAIM_STAKE_A] == 0) {
                use = _indexAddress[pod][MAX_UINT256];
            } else {
                use = _indexAddress[pod][0];
            }

            {
                lis[0] = use;
            }

            return lis;
        }

        uint256 i = 0;
        uint256 j = lef;
        while (j <= rig) {
            address use = _indexAddress[pod][j];

            if (use == address(0)) {
                break;
            }

            {
                lis[i] = use;
            }

            {
                i++;
            }

            if (j == MAX_UINT256) {
                break;
            }

            {
                j++;
            }
        }

        // Resize the array to remove any initially allocated zero address.
        assembly {
            mstore(lis, i)
        }

        return lis;
    }

    // searchToken can be called by anyone to lookup the token whitelist of any
    // given propose. Returns an empty list if no token whitelist is configured
    // for the given claim. The returned list can be used to determine the token
    // index required when calling updatePropose on claims with token
    // whitelists. Frontends should fetch the entire token whitelist, which
    // should not contain more tha 5 addresses, and check the user balances of
    // either token. Any token index of any token for which the user at hand has
    // in fact a non-zero balance may be used when calling updatePropose on
    // behalf of the user. Consider the following token whitelist for claim 33.
    //
    //     [
    //         Address(1), // user has balance 50.5977
    //         Address(2), // user has balance 0
    //         Address(3)  // user has balance 1
    //     ]
    //
    // Following from the information above, when calling updatePropose on
    // behalf of the user that owns tokens of the whitelisted addresses 1 and 3,
    // either token index 0 or 2 may be valid to stake in claim 33.
    function searchToken(uint256 pro) public view returns (address[] memory) {
        return _proposeToken[pro];
    }

    // searchVotes can be called by anyone to lookup the latest votes on either
    // side of any given market. The given claim ID must be the ID of the claim
    // with the lifecycle phase "propose".
    //
    //     out[0] the number of votes that verified events in the real world with true
    //     out[1] the number of votes that verified events in the real world with false
    //
    function searchVotes(uint256 pod) public view returns (uint256, uint256) {
        return (_truthResolve[pod][CLAIM_TRUTH_Y], _truthResolve[pod][CLAIM_TRUTH_N]);
    }
}
