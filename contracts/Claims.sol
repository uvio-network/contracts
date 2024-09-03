// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Bits} from "./lib/Bits.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Claims is AccessControl {
    //
    // EXTENSIONS
    //

    //
    using Bits for Bits.Map;

    //
    // ERRORS
    //

    //
    error Address(string why);
    //
    error Balance(string why, uint256 bal);
    //
    error Expired(string why, uint256 unx);
    //
    error Mapping(string why);
    //
    error Process(string why);

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

    // BASIS_TOTAL is the total amount of basis points in 100%. This amount is
    // used to calculate fees and their remainders.
    uint16 public constant BASIS_TOTAL = 10_000;

    // BOT_ROLE is the role assigned internally to designate privileged accounts
    // with the purpose of automating certain on behalf of the users. The goal
    // for this automation is to enhance the user experience on the platform, by
    // ensuring certain chores are done throughout the claim lifecycle without
    // bothering any user with it.
    bytes32 public constant BOT_ROLE = keccak256("BOT_ROLE");

    // CLAIM_ADDRESS_Y is a map index within _indexMembers. This number tracks
    // the latest incremented index of user addresses having staked reputation
    // in agreement with the associated claim.
    uint8 public constant CLAIM_ADDRESS_Y = 0;
    // CLAIM_ADDRESS_N is a map index within _indexMembers. This number tracks
    // the latest decremented index of user addresses having staked reputation
    // in disagreement with the associated claim.
    uint8 public constant CLAIM_ADDRESS_N = 1;

    // CLAIM_BALANCE_P is a bitmap index within _claimBalance. This boolean
    // tracks claims that got resolved by punishing users.
    uint8 public constant CLAIM_BALANCE_P = 0;
    // CLAIM_BALANCE_R is a bitmap index within _claimBalance. This boolean
    // tracks claims that got resolved by rewarding users.
    uint8 public constant CLAIM_BALANCE_R = 1;
    // CLAIM_BALANCE_U is a bitmap index within _claimBalance. This boolean
    // tracks claims that got already fully resolved.
    uint8 public constant CLAIM_BALANCE_U = 2;

    // CLAIM_EXPIRY_C is a map index within _claimExpired. This number tracks
    // the creation timestamp of claims with lifecycle "propose" in unix
    // seconds.
    uint8 public constant CLAIM_EXPIRY_C = 0;
    // CLAIM_EXPIRY_P is a map index within _claimExpired. This number tracks
    // the expiry of claims with lifecycle "propose" in unix seconds.
    uint8 public constant CLAIM_EXPIRY_P = 1;
    // CLAIM_EXPIRY_R is a map index within _claimExpired. This number tracks
    // the expiry of claims with lifecycle "resolve" in unix seconds.
    uint8 public constant CLAIM_EXPIRY_R = 2;

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
    // CLAIM_STAKE_D is a map index within _stakePropose. This number tracks the
    // amount of users for which we distributed stake already throughout the
    // process of updating user balances. This number must match the total
    // amount of stakers before any claim can fully be resolved.
    uint8 public constant CLAIM_STAKE_D = 4;
    // CLAIM_STAKE_C is a map index within _stakePropose. This number tracks the
    // amount of distributed stake that we carried over during multiple calls of
    // updateBalance.
    uint8 public constant CLAIM_STAKE_C = 5;

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

    //
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) private _addressStake;
    //
    mapping(uint256 => mapping(address => Bits.Map)) private _addressVotes;
    //
    mapping(address => uint256) private _allocBalance;
    //
    mapping(address => uint256) private _availBalance;
    //
    mapping(uint256 => Bits.Map) private _claimBalance;
    //
    mapping(uint256 => mapping(uint8 => uint256)) private _claimExpired;
    //
    mapping(uint256 => uint256[]) private _claimIndices;
    // dispute index for number of disputes in _claimMapping
    mapping(uint256 => uint256) private _claimDispute;
    //
    mapping(uint256 => mapping(uint256 => uint256)) private _claimMapping;
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
    // _truthResolve tracks the amount of votes cast per claim, on either side
    // of the market. The uint8 keys are either CLAIM_TRUTH_Y or CLAIM_TRUTH_N.
    // The uint256 values are the amounts of votes cast respectively.
    mapping(uint256 => mapping(uint8 => uint256)) private _truthResolve;
    //
    mapping(uint256 => mapping(uint8 => uint256)) private _stakePropose;

    //
    // VARIABLES
    //

    // basisDuration is the concluding timespan of a claim's expiry in basis
    // points, during which staking is not allowed anymore.
    uint16 public basisDuration = 1_000; // TODO make configurable
    // basisFee is the deducated amount of stake in basis points, from which
    // fees are subtracted already. This number is the basis for our internal
    // accounting when distributing staked tokens upon market resolution.
    uint16 public basisFee = 9_000;
    // basisProposer is the amount of proposer fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that users may earn by creating
    // claims.
    uint16 public basisProposer = 500;
    // basisProtocol is the amount of protocol fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that the protocol earns by
    // providing its services.
    uint16 public basisProtocol = 500;

    // owner is the owner address of the privileged entity receiving protocol
    // fees.
    address public owner = address(0);
    // token is the token address for this instance of the deployed contract.
    // That means every deployed contract is only responsible for serving claims
    // denominated in any given token address.
    address public immutable token = address(0);

    // constructor initializes an instance of the Claims contract by setting the
    // provided token address, which is immutable, meaning any Claims instance
    // will only ever use a single token. Multiple instances may be deployed to
    // support multiple tokens across the platform. The given owner address will
    // be able to modify the fee structure and designate the BOT_ROLE.
    constructor(address tok, address own) {
        if (tok == address(0)) {
            revert Address("invalid token");
        }

        if (own == address(0)) {
            revert Address("invalid owner");
        }

        if (!IERC20(tok).approve(address(this), type(uint256).max)) {
            revert Balance("approval failed", type(uint256).max);
        }

        {
            owner = own;
            token = tok;
        }

        {
            _grantRole(DEFAULT_ADMIN_ROLE, own);
        }
    }

    //
    receive() external payable {
        if (msg.value != 0) {
            revert Balance("invalid token", 0);
        }
    }

    //
    // PUBLIC
    //

    // createDispute may be called by anyone to dispute an already existing
    // claim. This means that a new market is created, which disputes the
    // resolution of the provided claim. The given claim ID "dis" must be
    // unique. The given balance "bal" must be at least twice as high as the
    // minimum balance required to participate in the market of the provided
    // propose. The caller must further own the given balance either as
    // available balance inside this Claims contract or as available balance
    // inside the relevant token contract. The given expiry must be at least 72
    // hours in the future and must not be farther in the future than 30 days
    // from now. Disputes may be layered up to a maximum of 3 instances so that
    // resolutions may be definitive and binding. Only one dispute per disputed
    // claim can be active at a time. Punished claims without valid resolution
    // cannot be disputed.
    function createDispute(uint256 dis, uint256 bal, bool vot, uint256 exp, uint256 pro) public {
        if (dis == 0) {
            revert Mapping("dispute invalid");
        }

        if (_claimExpired[dis][CLAIM_EXPIRY_P] != 0) {
            revert Mapping("claim invalid");
        }

        uint256 len = _claimDispute[pro];
        if (len >= 3) {
            // TODO test dispute limit
            revert Process("dispute limit");
        }

        unchecked {
            uint256 min;
            uint256 xpn;
            if (len == 0) {
                min = (_stakePropose[pro][CLAIM_STAKE_A] + _stakePropose[pro][CLAIM_STAKE_B]);
                xpn = _claimExpired[pro][CLAIM_EXPIRY_R];
            } else {
                uint256 prv = _claimMapping[pro][len - 1];
                min = (_stakePropose[prv][CLAIM_STAKE_A] + _stakePropose[prv][CLAIM_STAKE_B]);
                xpn = _claimExpired[prv][CLAIM_EXPIRY_R];
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
            // claim.  We enforce a fixed minimum amount for disputes to prevent
            // malicious actors to artificially price out other market
            // participants. Once a dispute is created, anyone can still stake
            // as much reputation as they are willing to risk.
            if (bal != (min * 2)) {
                revert Balance("minimum invalid", (min * 2));
            }
        }

        // Only a valid resolution can be disputed. A resolution is valid if
        // there have been more votes on one side than on the other. That
        // means a resolution without any vote, or a resolution with equal
        // votes cannot be disputed. Those invalid resolutions are the
        // punishable scenarios, which are definitive and binding.
        uint256 yay = _truthResolve[pro][CLAIM_TRUTH_Y];
        uint256 nah = _truthResolve[pro][CLAIM_TRUTH_N];
        if (!(yay > nah || yay < nah)) {
            revert Process("dispute invalid");
        }

        // The disputed claim points to its own disputes. That way we can lookup
        // disputes when updating user balances only having the claim ID of the
        // original propose available.
        {
            _claimMapping[pro][len] = dis;
            _claimDispute[pro]++;
        }

        // Dispute expiries must be at least 3 days in the future.
        if (exp < block.timestamp + 3 days) {
            revert Expired("expiry invalid", exp);
        }

        // Dispute expiries must not be more than 1 month in the future.
        if (exp > block.timestamp + 30 days) {
            revert Expired("expiry invalid", exp);
        }

        // Set the given expiry to make the code flow below work.
        {
            _claimExpired[dis][CLAIM_EXPIRY_C] = block.timestamp;
            _claimExpired[dis][CLAIM_EXPIRY_P] = exp;
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
            updatePropose(dis, bal, vot);
        }
    }

    // createPropose may be called by anyone to propose a new claim, which means
    // to create a new market given a truth statement that can later be verified
    // by the community. The given claim ID "pro" must be unique. The caller
    // must own the given balance either as available balance inside this Claims
    // contract or as available balance inside the relevant token contract. The
    // given expiry must be at least 24 hours in the future.
    function createPropose(uint256 pro, uint256 bal, bool vot, uint256 exp) public {
        if (pro == 0) {
            revert Mapping("claim invalid");
        }

        if (_claimExpired[pro][CLAIM_EXPIRY_P] != 0) {
            revert Mapping("claim invalid");
        }

        // Expiries must be at least 24 hours in the future.
        if (exp < block.timestamp + 24 hours) {
            revert Expired("expiry invalid", exp);
        }

        if (bal == 0) {
            revert Balance("balance invalid", bal);
        }

        // Set the given expiry to make the code flow below work.
        {
            _claimExpired[pro][CLAIM_EXPIRY_C] = block.timestamp;
            _claimExpired[pro][CLAIM_EXPIRY_P] = exp;
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
            updatePropose(pro, bal, vot);
        }
    }

    // updatePropose allows anyone to participate in any active market as long
    // as the minimum balance required can be provided. The given claim ID "cla"
    // may refer to claims of lifecycle phase "propose" or "dispute". The first
    // user staking on a new claim becomes the proposer, defining the minimum
    // balance required to participate in the new market. Proposer rewards may
    // apply upon market resolution.
    function updatePropose(uint256 cla, uint256 bal, bool vot) public {
        address use = msg.sender;

        unchecked {
            // Ensure that every staker provides at least the minimum balance
            // required in order to participate in this market.
            uint256 min = _stakePropose[cla][CLAIM_STAKE_A] + _stakePropose[cla][CLAIM_STAKE_B];
            if (bal < min) {
                revert Balance("below minimum", min);
            }

            // Ensure anyone can stake up until the defined expiry threshold.
            uint256 sta = _claimExpired[cla][CLAIM_EXPIRY_C];
            uint256 end = _claimExpired[cla][CLAIM_EXPIRY_P];
            if (end - (((end - sta) * basisDuration) / BASIS_TOTAL) < block.timestamp) {
                revert Expired("expiry invalid", end - (((end - sta) * basisDuration) / BASIS_TOTAL));
            }

            // Ensure the claim that is being staked on does in fact exist. Var
            // end here refers to the claim expiry tracked under CLAIM_EXPIRY_P,
            // which is the propose expiry. Only valid claims have a valid
            // expiry, and that cannot be zero.
            if (end == 0) {
                revert Mapping("claim invalid");
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
                    _addressVotes[cla][use].set(VOTE_STAKE_Y);
                    _stakePropose[cla][CLAIM_STAKE_Y] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[cla][use][ADDRESS_STAKE_Y] + _addressStake[cla][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[cla][use][ADDRESS_STAKE_Y] = bal;
                    }

                    {
                        _indexAddress[cla][_indexMembers[cla][CLAIM_ADDRESS_Y]] = use;
                        _indexMembers[cla][CLAIM_ADDRESS_Y]++; // base is 0
                    }
                } else {
                    _addressStake[cla][use][ADDRESS_STAKE_Y] += bal;
                }
            } else {
                {
                    _addressVotes[cla][use].set(VOTE_STAKE_N);
                    _stakePropose[cla][CLAIM_STAKE_N] += bal;
                }

                // Allocate the user stakes and keep track of the user address
                // based on their position in our index list. Consecutive calls
                // by the same user will maintain the user's individual index.
                if (_addressStake[cla][use][ADDRESS_STAKE_Y] + _addressStake[cla][use][ADDRESS_STAKE_N] == 0) {
                    {
                        _addressStake[cla][use][ADDRESS_STAKE_N] = bal;
                    }

                    {
                        _indexMembers[cla][CLAIM_ADDRESS_N]--; // base is 2^256-1
                        _indexAddress[cla][_indexMembers[cla][CLAIM_ADDRESS_N]] = use;
                    }
                } else {
                    _addressStake[cla][use][ADDRESS_STAKE_N] += bal;
                }
            }
        }
    }

    // can be called by anyone
    function updateBalance(uint256 pro, uint256 max) public {
        if (_claimBalance[pro].get(CLAIM_BALANCE_U)) {
            revert Process("already updated");
        }

        // Lookup the amounts of votes that we have recorded on either side. It
        // may very well be that there are no votes or that we have a tied
        // result. In those undesired cases, we punish those users who where
        // selected by the random truth sampling process, simply by taking all
        // of their staked balances away.
        uint256 yay;
        uint256 nah;

        uint256 len = _claimDispute[pro];
        if (len == 0) {
            uint256 exp = _claimExpired[pro][CLAIM_EXPIRY_R];

            //
            if (exp == 0 || exp > block.timestamp) {
                revert Expired("resolve active", exp);
            }

            // Any claim of lifecycle phase "resolve" can be challenged. Only
            // after the resolving claim expired, AND only after some designated
            // challenge period passed on top of the claim's expiry, only then
            // can a claim be finalized and user balances be updated.
            if (exp + 7 days > block.timestamp) {
                revert Expired("challenge active", exp + 7 days);
            }

            {
                yay = _truthResolve[pro][CLAIM_TRUTH_Y];
                nah = _truthResolve[pro][CLAIM_TRUTH_N];
            }
        } else {
            uint256 dis = _claimMapping[pro][len - 1];
            uint256 exp = _claimExpired[dis][CLAIM_EXPIRY_R];

            //
            if (exp == 0 || exp > block.timestamp) {
                revert Expired("dispute active", exp);
            }

            // Similar to challenging the outcomes of the original claims with
            // lifecycle phase "propose", disputes may also be challenged.
            // Therefore we apply challenge periods to all disputes, except the
            // last ones. Once the maximum amount of disputes has been reached,
            // the final dispute is definitive and binding, meaning balances can
            // be updated immediately after the final dispute resolved.
            if (exp + 7 days > block.timestamp && len < 3) {
                // TODO test final disputes have no challenge period
                revert Expired("challenge active", exp + 7 days);
            }

            {
                yay = _truthResolve[dis][CLAIM_TRUTH_Y];
                nah = _truthResolve[dis][CLAIM_TRUTH_N];
            }
        }

        //
        uint256 lef = _indexMembers[pro][CLAIM_ADDRESS_N];
        uint256 rig = _indexMembers[pro][CLAIM_ADDRESS_Y];

        //
        uint256 mnl = lef;

        unchecked {
            mnl--;
        }

        uint256 all = rig + (MAX_UINT256 - mnl);

        //
        unchecked {
            lef += _stakePropose[pro][CLAIM_STAKE_D];
        }

        //
        if (all == 1) {
            if (yay == nah) {
                return punishOne(pro);
            } else {
                return rewardOne(pro, yay > nah);
            }
        }

        uint256 toy = _stakePropose[pro][CLAIM_STAKE_Y];
        uint256 ton = _stakePropose[pro][CLAIM_STAKE_N];
        if (yay > nah || yay < nah) {
            rewardAll(pro, lef, rig, max, toy, ton, yay > nah);
        } else {
            punishAll(pro, lef, rig, max);
        }

        // Only credit the proposer and the protocol once everyone else got
        // accounted for. The proposer is always the very first user, because
        // they created the claim.
        if (_stakePropose[pro][CLAIM_STAKE_D] == all) {
            unchecked {
                address first;
                if (_stakePropose[pro][CLAIM_STAKE_A] == 0) {
                    first = _indexAddress[pro][MAX_UINT256];
                } else {
                    first = _indexAddress[pro][0];
                }

                uint256 total = toy + ton;
                uint256 share = (total * basisProposer) / BASIS_TOTAL;

                _availBalance[first] += share;
                _availBalance[owner] += total - (share + _stakePropose[pro][CLAIM_STAKE_C]);
            }

            {
                _claimBalance[pro].set(CLAIM_BALANCE_U);
            }

            {
                delete _stakePropose[pro][CLAIM_STAKE_C];
                delete _stakePropose[pro][CLAIM_STAKE_D];
            }
        }
    }

    function withdraw(uint256 bal) public {
        address use = msg.sender;

        if (_availBalance[use] < bal) {
            revert Balance("insufficient funds", _availBalance[use]);
        }

        unchecked {
            _availBalance[use] -= bal;
        }

        if (!IERC20(token).transferFrom(address(this), use, bal)) {
            revert Balance("transfer failed", bal);
        }
    }

    //
    // PUBLIC PRIVILEGED
    //

    // must be called by some privileged bot
    function createResolve(uint256 pro, uint256[] calldata ind, uint256 exp) public onlyRole(BOT_ROLE) {
        uint256 cep = _claimExpired[pro][CLAIM_EXPIRY_P];

        if (cep == 0) {
            revert Mapping("propose invalid");
        }

        if (_claimExpired[pro][CLAIM_EXPIRY_R] != 0) {
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
            address use = _indexAddress[pro][ind[i]];

            // We we ended up with the zero address it means the provided index
            // is out of range and the random truth sampling process failed to
            // come up with a list of valid indices.
            if (use == address(0)) {
                revert Mapping("zero address");
            }

            // If for any reason the random truth sampling process provides us
            // with the same index twice, then we revert the whole transaction.
            // The rule is "one user one vote".
            if (_addressVotes[pro][use].get(VOTE_TRUTH_S)) {
                revert Mapping("already selected");
            }

            {
                _addressVotes[pro][use].set(VOTE_TRUTH_S);
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
            _claimExpired[pro][CLAIM_EXPIRY_R] = exp;
            _claimIndices[pro] = ind;
        }
    }

    // updateFees allows the owner to change the fee structure of this contract.
    // All fees must be provided in basis points. Fees taken must not be greater
    // than 50%. All basis points must always sum to 10,000.
    function updateFees(uint16 fee, uint16 psr, uint16 ptc) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (fee < 5_000 || fee + psr + ptc != BASIS_TOTAL) {
            revert Process("fees invalid");
        }

        {
            basisFee = fee;
            basisProposer = psr;
            basisProtocol = ptc;
        }
    }

    // updateResolve allows any whitelisted user to verify the truth with
    // respect to the associated claim. Whitelisting happens through the process
    // of random truth sampling, where an equal number of agreeing and
    // disagreeing users is selected to verify events as happened in the real
    // world on behalf of all market participants. All voting happens on a "one
    // user one vote" basis.
    function updateResolve(uint256 pro, bool vot) public {
        uint256 exp = _claimExpired[pro][CLAIM_EXPIRY_R];

        if (exp == 0) {
            revert Mapping("propose invalid");
        }

        if (exp < block.timestamp) {
            revert Expired("resolve expired", exp);
        }

        address use = msg.sender;

        if (!_addressVotes[pro][use].get(VOTE_TRUTH_S)) {
            revert Address("not allowed");
        }

        if (_addressVotes[pro][use].get(VOTE_TRUTH_V)) {
            revert Address("already voted");
        }

        if (vot) {
            _addressVotes[pro][use].set(VOTE_TRUTH_Y);
            _truthResolve[pro][CLAIM_TRUTH_Y]++;
        } else {
            _addressVotes[pro][use].set(VOTE_TRUTH_N);
            _truthResolve[pro][CLAIM_TRUTH_N]++;
        }

        {
            _addressVotes[pro][use].set(VOTE_TRUTH_V);
        }
    }

    //
    // PRIVATE
    //

    //
    function punishAll(uint256 pro, uint256 lef, uint256 rig, uint256 max) private {
        if (_stakePropose[pro][CLAIM_STAKE_D] == 0) {
            _claimBalance[pro].set(CLAIM_BALANCE_P);
        }

        while (max != 0) {
            address use = _indexAddress[pro][lef];
            uint256 bal = _addressStake[pro][use][ADDRESS_STAKE_Y] + _addressStake[pro][use][ADDRESS_STAKE_N];

            // Every user loses their allocated balance when claims get
            // resolved. Only those users who were right in the end regain their
            // allocated balances in the form of available balances, plus
            // rewards.
            unchecked {
                _allocBalance[use] -= bal;
            }

            //
            uint256 ded = (bal * basisFee) / BASIS_TOTAL;

            // Since this is the punishment case of resolving claims, every user
            // who was selected by the random truth sampling process loses all
            // of their staked balance. In this particular failure scenario, the
            // protocol receives all funds taken from the users that the random
            // truth sampling process selected. As a reminder, this punishment
            // happens because the selected users did either not come to
            // consensus according to events in the real world, or did not do at
            // all what they have been asked for.
            if (_addressVotes[pro][use].get(VOTE_TRUTH_S)) {
                _availBalance[owner] += ded;
            } else {
                _availBalance[use] += ded;
            }

            {
                delete _addressStake[pro][use][ADDRESS_STAKE_Y];
                delete _addressStake[pro][use][ADDRESS_STAKE_N];
            }

            unchecked {
                {
                    _stakePropose[pro][CLAIM_STAKE_C] += ded;
                    _stakePropose[pro][CLAIM_STAKE_D]++;
                }

                {
                    lef++;
                    max--;
                }
            }

            if (lef == rig) {
                break;
            }
        }
    }

    //
    function punishOne(uint256 pro) private {
        address use;
        if (_stakePropose[pro][CLAIM_STAKE_A] == 0) {
            use = _indexAddress[pro][MAX_UINT256];
        } else {
            use = _indexAddress[pro][0];
        }

        unchecked {
            uint256 bal = _addressStake[pro][use][ADDRESS_STAKE_Y] + _addressStake[pro][use][ADDRESS_STAKE_N];

            {
                _allocBalance[use] -= bal;
                _availBalance[owner] += bal;
            }

            {
                _claimBalance[pro].set(CLAIM_BALANCE_P);
                _claimBalance[pro].set(CLAIM_BALANCE_U);
            }

            {
                delete _addressStake[pro][use][ADDRESS_STAKE_Y];
                delete _addressStake[pro][use][ADDRESS_STAKE_N];
            }
        }
    }

    //
    function rewardAll(uint256 pro, uint256 lef, uint256 rig, uint256 max, uint256 toy, uint256 ton, bool win)
        private
    {
        if (_stakePropose[pro][CLAIM_STAKE_D] == 0) {
            _claimBalance[pro].set(CLAIM_BALANCE_R);
        }

        // Calculate the amounts for total staked assets on either side by
        // deducting all relevant fees. The total staked assets are used as
        // basis for calculating user rewards below, respective to their
        // individual share of the winning pool and the captured amount from the
        // loosing side.
        uint256 fey = (toy * basisFee) / BASIS_TOTAL;
        uint256 fen = (ton * basisFee) / BASIS_TOTAL;

        while (max != 0) {
            address use = _indexAddress[pro][lef];

            {
                rewardAllLoop(pro, use, win, fey, fen);
            }

            unchecked {
                {
                    _stakePropose[pro][CLAIM_STAKE_D]++;
                }

                {
                    lef++;
                    max--;
                }
            }

            if (lef == rig) {
                break;
            }
        }
    }

    function rewardAllLoop(uint256 pro, address use, bool win, uint256 fey, uint256 fen) private {
        uint256 sty = _addressStake[pro][use][ADDRESS_STAKE_Y];
        uint256 stn = _addressStake[pro][use][ADDRESS_STAKE_N];

        // Every user loses their allocated balance when claims get
        // resolved. Only those users who were right in the end regain their
        // allocated balances in the form of available balances, plus
        // rewards.
        unchecked {
            _allocBalance[use] -= sty + stn;
        }

        if (win) {
            // After verifying events in the real world the majority of
            // voters decided that the proposed claim turned out to be true.
            // Everyone staking reputation in agreement with the proposed
            // claim will now earn their share of rewards. The users' staked
            // balances plus rewards become now part of the respective
            // available balances.
            if (_addressVotes[pro][use].get(VOTE_STAKE_Y)) {
                // Since we are working with the total amounts of staked assets as
                // deducted fee basis, we also need to deduct the fees from every single
                // staked balance here. Otherwise the user's share would inflate
                // artificially relative to the deducted total that we use as a basis
                // below.
                unchecked {
                    uint256 ded = (sty * basisFee) / BASIS_TOTAL;
                    uint256 shr = (ded * 1e18) / fey;
                    uint256 rew = (shr * fen) / 1e18;
                    uint256 sum = (rew + ded);

                    _availBalance[use] += sum;
                    _stakePropose[pro][CLAIM_STAKE_C] += sum;
                }
            }
        } else {
            // After verifying events in the real world the majority of
            // voters decided that the proposed claim turned out to be
            // false. Everyone staking reputation in disagreement with the
            // proposed claim will now earn their share of rewards. The
            // users' staked balances plus rewards become now part of the
            // respective available balances.
            if (_addressVotes[pro][use].get(VOTE_STAKE_N)) {
                // Since we are working with the total amounts of staked assets as
                // deducted fee basis, we also need to deduct the fees from every single
                // staked balance here. Otherwise the user's share would inflate
                // artificially relative to the deducted total that we use as a basis
                // below.
                unchecked {
                    uint256 ded = (stn * basisFee) / BASIS_TOTAL;
                    uint256 shr = (ded * 1e18) / fen;
                    uint256 rew = (shr * fey) / 1e18;
                    uint256 sum = (rew + ded);

                    _availBalance[use] += sum;
                    _stakePropose[pro][CLAIM_STAKE_C] += sum;
                }
            }
        }

        {
            delete _addressStake[pro][use][ADDRESS_STAKE_Y];
            delete _addressStake[pro][use][ADDRESS_STAKE_N];
        }
    }

    //
    function rewardOne(uint256 pro, bool win) private {
        address use;
        if (_stakePropose[pro][CLAIM_STAKE_A] == 0) {
            use = _indexAddress[pro][MAX_UINT256];
        } else {
            use = _indexAddress[pro][0];
        }

        uint256 sty = _addressStake[pro][use][ADDRESS_STAKE_Y];
        uint256 stn = _addressStake[pro][use][ADDRESS_STAKE_N];

        unchecked {
            uint256 bal = sty + stn;

            {
                _allocBalance[use] -= bal;
            }

            if (win) {
                if (_addressVotes[pro][use].get(VOTE_STAKE_Y)) {
                    {
                        _availBalance[use] += sty;
                        _claimBalance[pro].set(CLAIM_BALANCE_R);
                    }

                    if (stn != 0) {
                        _availBalance[owner] += stn;
                    }
                } else {
                    _availBalance[owner] += bal;
                    _claimBalance[pro].set(CLAIM_BALANCE_P);
                }
            } else {
                if (_addressVotes[pro][use].get(VOTE_STAKE_N)) {
                    {
                        _availBalance[use] += stn;
                        _claimBalance[pro].set(CLAIM_BALANCE_R);
                    }

                    if (sty != 0) {
                        _availBalance[owner] += sty;
                    }
                } else {
                    _availBalance[owner] += bal;
                    _claimBalance[pro].set(CLAIM_BALANCE_P);
                }
            }

            {
                _claimBalance[pro].set(CLAIM_BALANCE_U);
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
    function searchExpired(uint256 pro) public view returns (uint256, uint256) {
        return (_claimExpired[pro][CLAIM_EXPIRY_P], _claimExpired[pro][CLAIM_EXPIRY_R]);
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
    function searchIndices(uint256 pro)
        public
        view
        returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)
    {
        uint256 toy = _indexMembers[pro][CLAIM_ADDRESS_Y];
        uint256 ley = 0;
        uint256 riy = toy;

        if (toy > 0) {
            riy--;
        }

        uint256 len = _indexMembers[pro][CLAIM_ADDRESS_N];
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

    // searchPropose can be called by anyone to lookup the amount of tokens
    // staked on either side of any given market. Additionally, the minimum
    // stake required in order to participate in the given market is also
    // returned.
    //
    //     out[0] the amount of reputation staked in agreement
    //     out[1] the minimum amount of stake required to participate
    //     out[2] the amount of reputation staked in disagreement
    //
    function searchPropose(uint256 pro) public view returns (uint256, uint256, uint256) {
        return (
            _stakePropose[pro][CLAIM_STAKE_Y],
            _stakePropose[pro][CLAIM_STAKE_A] + _stakePropose[pro][CLAIM_STAKE_B],
            _stakePropose[pro][CLAIM_STAKE_N]
        );
    }

    // can be called by anyone, may not return anything
    function searchResolve(uint256 pro, uint8 ind) public view returns (bool) {
        return _claimBalance[pro].get(ind);
    }

    // searchSamples works in conjunction with the indices provided by
    // searchIndices. Anyone can lookup the voter addresses of either side of
    // any given market. Voting addresses are indexed based on the order of
    // indices provided during the contract write of createResolve. The
    // boundaries lef and rig are both inclusive. Below is an example of
    // searching for all 2 voters on the agreeing side of the market.
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
    function searchSamples(uint256 pro, uint256 lef, uint256 rig) public view returns (address[] memory) {
        address[] memory lis = new address[](rig - lef + 1);

        uint256 i = 0;
        uint256 j = 0;
        while (i < lis.length && j < _claimIndices[pro].length) {
            // Go through each of the recorded indices, one after another. Those
            // indices are not guaranteed to be ordered.
            //
            //     [ 3 0 96 4 99 95 1 97 2 98 ]
            //
            uint256 ind = _claimIndices[pro][j];

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
                lis[i] = _indexAddress[pro][ind];
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
    function searchStakers(uint256 pro, uint256 lef, uint256 rig) public view returns (address[] memory) {
        address[] memory lis = new address[](rig - lef + 1);

        if (lef == MID_UINT256 && rig == MID_UINT256) {
            address use;
            if (_stakePropose[pro][CLAIM_STAKE_A] == 0) {
                use = _indexAddress[pro][MAX_UINT256];
            } else {
                use = _indexAddress[pro][0];
            }

            {
                lis[0] = use;
            }

            return lis;
        }

        uint256 i = 0;
        uint256 j = lef;
        while (j <= rig) {
            address use = _indexAddress[pro][j];

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

    // can be called by anyone, may not return anything
    function searchVotes(uint256 pro) public view returns (uint256, uint256) {
        return (_truthResolve[pro][CLAIM_TRUTH_Y], _truthResolve[pro][CLAIM_TRUTH_N]);
    }
}
