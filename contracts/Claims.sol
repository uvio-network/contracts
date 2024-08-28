// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Bits} from "./lib/Bits.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

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
    error Expired(string why, uint48 unx);
    //
    error Mapping(string why);
    //
    error Process(string why);

    //
    // CONSTANTS
    //

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

    // CLAIM_STAKE_Y is a map index within _stakePropose. This number tracks the
    // total amount of staked reputation agreeing with the associated claim.
    uint8 public constant CLAIM_STAKE_Y = 0;
    // CLAIM_STAKE_N is a map index within _stakePropose. This number tracks the
    // total amount of staked reputation disagreeing with the associated claim.
    uint8 public constant CLAIM_STAKE_N = 1;
    // CLAIM_STAKE_D is a map index within _stakePropose. This number tracks the
    // amount of users for which we distributed stake already throughout the
    // process of updating user balances. This number must match the total
    // amount of stakers before any claim can fully be resolved.
    uint8 public constant CLAIM_STAKE_D = 2;
    // CLAIM_STAKE_C is a map index within _stakePropose. This number tracks the
    // amount of distributed stake that we carried over during multiple calls of
    // updateBalance.
    uint8 public constant CLAIM_STAKE_C = 3;

    // CLAIM_TRUTH_Y is a map index within _truthResolve. This number tracks the
    // total amount of votes cast saying the associated claim was true.
    uint8 public constant CLAIM_TRUTH_Y = 0;
    // CLAIM_TRUTH_N is a map index within _truthResolve. This number tracks the
    // total amount of votes cast saying the associated claim was false.
    uint8 public constant CLAIM_TRUTH_N = 1;

    //
    uint256 public constant BASIS_FEE = 9_000;
    // BASIS_PROPOSER is the amount of proposer fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that users may earn by creating
    // claims.
    uint16 public constant BASIS_PROPOSER = 500;
    // BASIS_PROTOCOL is the amount of protocol fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that the protocol earns by
    // providing its services.
    uint16 public constant BASIS_PROTOCOL = 500; // TODO fees should be modifiable
    // BASIS_TOTAL is the total amount of basis points in 100%. This amount is
    // used to calculate fees and their remainders.
    uint16 public constant BASIS_TOTAL = 10_000;

    //
    uint256 public constant MAX_UINT256 = type(uint256).max;
    uint256 public constant MID_UINT256 = type(uint256).max / 2;

    // SECONDS_DAY is one day in seconds.
    uint48 public constant SECONDS_DAY = 86_400;
    // SECONDS_WEEK is one week in seconds.
    uint48 public constant SECONDS_WEEK = 604_800;

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
    mapping(uint256 => mapping(address => uint256)) private _addressStake;
    //
    mapping(uint256 => mapping(address => Bits.Map)) private _addressVotes;
    //
    mapping(address => uint256) private _allocBalance;
    //
    mapping(address => uint256) private _availBalance;
    //
    mapping(uint256 => Bits.Map) private _claimBalance;
    //
    mapping(uint256 => uint48) private _claimExpired;
    //
    mapping(uint256 => uint256[]) private _claimIndices;
    //
    mapping(uint256 => uint256) private _claimMapping;
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

    // owner is the owner address of the privileged entity receiving protocol
    // fees.
    address public immutable owner = address(0);
    // token is the token address for this instance of the deployed contract.
    // That means every deployed contract is only responsible for serving claims
    // denominated in any given token address.
    address public immutable token = address(0);

    //
    constructor(address tok, address own) {
        if (tok == address(0)) {
            revert Address("invalid token");
        }
        if (own == address(0)) {
            revert Address("invalid owner");
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

    // called by anyone
    function createPropose(uint256 pro, uint256 bal, bool vot, uint48 exp) public {
        if (pro == 0) {
            revert Mapping("claim invalid");
        }

        // Look for the very first deposit related to the given claim. If this
        // call is for the very first deposit itself, then there is no minimum
        // balance to check against. In that very first case we simply check the
        // given balance against 0, which allows the proposer to define the
        // minimum stake required to participate in this market. All following
        // users have then to comply with the minimum balance defined.
        uint256 min = _addressStake[pro][address(0)];
        if (bal < min) {
            revert Balance("below minimum", min);
        }

        address use = msg.sender;

        if (_claimExpired[pro] == 0) {
            // Expiries must be at least 24 hours in the future.
            if (exp < Time.timestamp() + SECONDS_DAY) {
                revert Expired("expiry invalid", exp);
            }

            // Set the given expiry to make the code flow below work.
            {
                _claimExpired[pro] = exp;
            }

            // In case this is the creation of a claim with lifecycle "propose",
            // store the first balance provided under the zero address key, so
            // that we can remember the minimum balance required for staking
            // reputation on this claim. Using the zero address as key here
            // allows us to use the same mapping we use for all user stakes, so
            // that we do not have to maintain another separate data structure
            // for the minimum balance required. This mechanism works because
            // nobody can ever control the zero address.
            {
                _addressStake[pro][address(0)] = bal; // minimum balance
                _indexAddress[pro][MID_UINT256] = use; // proposer address
            }
        } else {
            // Ensure anyone can stake up until the defined expiry.
            if (_claimExpired[pro] < Time.timestamp()) {
                revert Expired("expiry invalid", _claimExpired[pro]);
            }
        }

        // Do the transfer right at the top, because this is the last thing that
        // can actually fail.
        if (!IERC20(token).transferFrom(use, address(this), bal)) {
            revert Balance("transfer failed", bal);
        }

        unchecked {
            // Track the user's allocated balance so we can tell people where
            // they stand any time. The allocated balances are all funds that
            // are currently bound in active markets. The user's available
            // balance does not change here because the user is directly staking
            // their deposited balance when participating in a market. Only
            // later may available balances increase, if a user may be rewarded
            // after claims have been resolved.
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
                _addressVotes[pro][use].set(VOTE_STAKE_Y);
                _stakePropose[pro][CLAIM_STAKE_Y] += bal;
            } else {
                _addressVotes[pro][use].set(VOTE_STAKE_N);
                _stakePropose[pro][CLAIM_STAKE_N] += bal;
            }

            // Allocate the user stakes and keep track of the user address based
            // on their position in our index list. Consecutive calls by the
            // same user will maintain the user's individual index.
            if (_addressStake[pro][use] == 0) {
                {
                    _addressStake[pro][use] = bal;
                }

                if (vot) {
                    _indexAddress[pro][_indexMembers[pro][CLAIM_ADDRESS_Y]] = use;
                    _indexMembers[pro][CLAIM_ADDRESS_Y]++; // base is 0
                } else {
                    _indexMembers[pro][CLAIM_ADDRESS_N]--; // base is 2^256-1
                    _indexAddress[pro][_indexMembers[pro][CLAIM_ADDRESS_N]] = use;
                }
            } else {
                _addressStake[pro][use] += bal;
            }
        }
    }

    // TODO test withdrawals since we implemented updating balances
    function withdraw(uint256 bal) public {
        address use = msg.sender;

        if (_availBalance[use] < bal) {
            revert Balance("insufficient funds", _availBalance[use]);
        }

        if (!IERC20(token).transferFrom(address(this), use, bal)) {
            revert Balance("transfer failed", bal);
        }

        unchecked {
            _availBalance[use] -= bal;
        }
    }

    //
    // PUBLIC PRIVILEGED
    //

    // must be called by some privileged bot
    function createResolve(uint256 pro, uint256 res, uint256[] memory ind, uint48 exp) public onlyRole(BOT_ROLE) {
        if (res == 0) {
            revert Mapping("resolve invalid");
        }

        if (_claimExpired[pro] == 0) {
            revert Mapping("propose invalid");
        }

        if (_claimExpired[res] != 0) {
            revert Mapping("claim overwrite");
        }

        if (_claimExpired[pro] > Time.timestamp()) {
            revert Expired("propose active", _claimExpired[pro]);
        }

        if (ind.length == 0) {
            revert Mapping("indices invalid");
        }

        // Expiries must be at least 24 hours in the future.
        if (exp < Time.timestamp() + SECONDS_DAY) {
            revert Expired("expiry invalid", exp);
        }

        for (uint256 i = 0; i < ind.length; i++) {
            address use = _indexAddress[pro][ind[i]];

            // We we ended up with the zero address it means the provided index
            // is out of range and random truth sampling process failed to come
            // up with a list of valid indices.
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
        }

        {
            _claimExpired[res] = exp;
            _claimIndices[pro] = ind;
            _claimMapping[pro] = res;
        }
    }

    // TODO handle nullify and dispute

    // can be called by anyone
    function updateBalance(uint256 pro, uint256 len) public {
        uint256 res = _claimMapping[pro];
        uint48 exp = _claimExpired[res];
        uint48 unx = Time.timestamp();

        if (_claimBalance[res].get(CLAIM_BALANCE_U)) {
            revert Process("already updated");
        }

        if (exp == 0) {
            revert Expired("resolve unallocated", exp);
        }

        if (exp > unx) {
            revert Expired("resolve active", exp);
        }

        // Any claim of lifecycle phase "resolve" can be challenged. Only after
        // the resolving claim expired, AND only after some designated challenge
        // period passed on top of the claim's expiry, only then can a claim be
        // finalized and user balances be updated.
        if (exp + SECONDS_WEEK > unx) {
            revert Expired("challenge active", exp + SECONDS_WEEK);
        }

        // Lookup the amounts of votes that we have recorded on either side. It
        // may very well be that there are no votes or that we have a tied
        // result. In those undesired cases, we punish those users who where
        // selected by the random truth sampling process, simply by taking all
        // of their staked balances away.
        uint256 yay = _truthResolve[res][CLAIM_TRUTH_Y];
        uint256 nah = _truthResolve[res][CLAIM_TRUTH_N];

        //
        uint256 mnl = _indexMembers[pro][CLAIM_ADDRESS_N];

        unchecked {
            mnl--;
        }

        uint256 all = _indexMembers[pro][CLAIM_ADDRESS_Y] + (MAX_UINT256 - mnl);

        //
        if (all == 1) {
            return updateSingle(pro, res, yay > nah);
        }

        if (yay > nah || yay < nah) {
            updateReward(pro, res, len, yay > nah);
        } else {
            updatePunish(pro, res, len);
        }

        // Only credit the proposer and the protocol once everyone else got
        // accounted for. The proposer is always the very first user, because
        // they created the claim.
        if (_stakePropose[pro][CLAIM_STAKE_D] == all) {
            unchecked {
                address first = _indexAddress[pro][MID_UINT256];
                uint256 total = _stakePropose[pro][CLAIM_STAKE_Y] + _stakePropose[pro][CLAIM_STAKE_N];
                uint256 share = (total * BASIS_PROPOSER) / BASIS_TOTAL;

                _availBalance[first] += share;
                _availBalance[owner] += total - (share + _stakePropose[pro][CLAIM_STAKE_C]);
            }

            {
                _claimBalance[res].set(CLAIM_BALANCE_U);
            }

            {
                delete _stakePropose[pro][CLAIM_STAKE_C];
                delete _stakePropose[pro][CLAIM_STAKE_D];
            }
        }
    }

    // any whitelisted user can call
    function updateResolve(uint256 pro, bool vot) public {
        uint256 res = _claimMapping[pro];
        uint48 exp = _claimExpired[res];

        if (exp == 0) {
            revert Mapping("propose invalid");
        }

        if (exp < Time.timestamp()) {
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
            _truthResolve[res][CLAIM_TRUTH_Y]++;
        } else {
            _addressVotes[pro][use].set(VOTE_TRUTH_N);
            _truthResolve[res][CLAIM_TRUTH_N]++;
        }

        {
            _addressVotes[pro][use].set(VOTE_TRUTH_V);
        }
    }

    //
    // PRIVATE
    //

    // TODO this result cannot be disputed
    function updatePunish(uint256 pro, uint256 res, uint256 len) private {
        if (_stakePropose[pro][CLAIM_STAKE_D] == 0) {
            _claimBalance[res].set(CLAIM_BALANCE_P);
        }

        uint256 lef = _indexMembers[pro][CLAIM_ADDRESS_N];
        uint256 rig = _indexMembers[pro][CLAIM_ADDRESS_Y];
        while (len != 0) {
            address use = _indexAddress[pro][lef];
            uint256 bal = _addressStake[pro][use];

            bool sel = _addressVotes[pro][use].get(VOTE_TRUTH_S);

            // Every user loses their allocated balance when claims get
            // resolved. In the punishment case only those users who were not
            // authorized by the random truth sampling process get their staked
            // balance returned, minus fees.
            unchecked {
                _allocBalance[use] -= bal;
            }

            // Since this is the punishment case of resolving claims, every user
            // who was selected by the random truth sampling process loses all
            // of their staked balance. In this particular failure scenario, the
            // protocol receives all funds taken from the users that the random
            // truth sampling process selected. As a reminder, this punishment
            // happens because the selected users did either not come to
            // consensus according to events in the real world, or did not do at
            // all what they have been asked for.
            if (sel) {
                // TODO test this because it is probably completely wrong
                _availBalance[owner] += (bal * BASIS_FEE) / BASIS_TOTAL;
            } else {
                _availBalance[use] += (bal * BASIS_FEE) / BASIS_TOTAL;
            }

            unchecked {
                lef++;
                len--;
            }

            if (lef == rig) {
                break;
            }
        }
    }

    //
    function updateReward(uint256 pro, uint256 res, uint256 len, bool win) private {
        if (_stakePropose[pro][CLAIM_STAKE_D] == 0) {
            _claimBalance[res].set(CLAIM_BALANCE_R);
        }

        // Calculate the amounts for total staked assets on either side by
        // deducting all relevant fees. The total staked assets are used as
        // basis for calculating user rewards below, respective to their
        // individual share of the winning pool and the captured amount from the
        // loosing side.
        uint256 fey = (_stakePropose[pro][CLAIM_STAKE_Y] * BASIS_FEE) / BASIS_TOTAL;
        uint256 fen = (_stakePropose[pro][CLAIM_STAKE_N] * BASIS_FEE) / BASIS_TOTAL;

        //
        uint256 lef = _indexMembers[pro][CLAIM_ADDRESS_N];
        uint256 rig = _indexMembers[pro][CLAIM_ADDRESS_Y];

        //
        unchecked {
            lef += _stakePropose[pro][CLAIM_STAKE_D];
        }

        while (len != 0) {
            address use = _indexAddress[pro][lef];
            uint256 bal = _addressStake[pro][use];

            // Every user loses their allocated balance when claims get
            // resolved. Only those users who were right in the end regain their
            // allocated balances in the form of available balances, plus
            // rewards.
            unchecked {
                _allocBalance[use] -= bal;
            }

            if (win) {
                // After verifying events in the real world the majority of
                // voters decided that the proposed claim turned out to be true.
                // Everyone staking reputation in agreement with the proposed
                // claim will now earn their share of rewards. The users' staked
                // balances plus rewards become now part of the respective
                // available balances.
                if (_addressVotes[pro][use].get(VOTE_STAKE_Y)) {
                    // Since we are working with the total amounts of staked
                    // assets as deducted fee basis, we also need to deduct the
                    // fees from every single staked balance here. Otherwise the
                    // user's share would inflate artificially relative to the
                    // deducted total that we use as a basis below.
                    unchecked {
                        uint256 ded = (bal * BASIS_FEE) / BASIS_TOTAL;
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
                    // Since we are working with the total amounts of staked
                    // assets as deducted fee basis, we also need to deduct the
                    // fees from every single staked balance here. Otherwise the
                    // user's share would inflate artificially relative to the
                    // deducted total that we use as a basis below.
                    unchecked {
                        uint256 ded = (bal * BASIS_FEE) / BASIS_TOTAL;
                        uint256 shr = (ded * 1e18) / fen;
                        uint256 rew = (shr * fey) / 1e18;
                        uint256 sum = (rew + ded);

                        _availBalance[use] += sum;
                        _stakePropose[pro][CLAIM_STAKE_C] += sum;
                    }
                }
            }

            {
                delete _addressStake[pro][use];
            }

            unchecked {
                {
                    _stakePropose[pro][CLAIM_STAKE_D]++;
                }

                {
                    lef++;
                    len--;
                }
            }

            if (lef == rig) {
                break;
            }
        }
    }

    //
    function updateSingle(uint256 pro, uint256 res, bool win) private {
        address use = _indexAddress[pro][MID_UINT256];
        uint256 bal = _addressStake[pro][use];

        unchecked {
            {
                _allocBalance[use] -= bal;
            }

            if (win) {
                if (_addressVotes[pro][use].get(VOTE_STAKE_Y)) {
                    _availBalance[use] += bal;
                    _claimBalance[res].set(CLAIM_BALANCE_R);
                } else {
                    _availBalance[owner] += bal;
                    _claimBalance[res].set(CLAIM_BALANCE_P);
                }
            } else {
                if (_addressVotes[pro][use].get(VOTE_STAKE_N)) {
                    _availBalance[use] += bal;
                    _claimBalance[res].set(CLAIM_BALANCE_R);
                } else {
                    _availBalance[owner] += bal;
                    _claimBalance[res].set(CLAIM_BALANCE_P);
                }
            }

            {
                _claimBalance[res].set(CLAIM_BALANCE_U);
            }
        }
    }

    //
    // PUBLIC VIEW
    //

    // can be called by anyone, may not return anything
    function searchBalance(address use) public view returns (uint256, uint256) {
        return (_allocBalance[use], _availBalance[use]);
    }

    // can be called by anyone, may not return anything
    function searchExpired(uint256 cla) public view returns (uint256) {
        return _claimExpired[cla];
    }

    // can be called by anyone, may not return anything
    //
    //     out[0] the total amount of first stakers in agreement
    //     out[1] the left handside index for first stakers in agreement
    //     out[2] the right handside index for first stakers in agreement
    //     out[3] the left handside index of the proposer address
    //     out[4] the right handside index of the proposer address
    //     out[5] the left handside index for first stakers in disagreement
    //     out[6] the right handside index for first stakers in disagreement
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
    //     searchStakers(CLAIM, out[6], out[7])
    //
    function searchIndices(
        uint256 pro
    )
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

    // can be called by anyone, may not return anything
    function searchPropose(uint256 pro) public view returns (uint256, uint256) {
        return (_stakePropose[pro][CLAIM_STAKE_Y], _stakePropose[pro][CLAIM_STAKE_N]);
    }

    // can be called by anyone, may not return anything
    function searchResolve(uint256 pro, uint8 ind) public view returns (bool) {
        uint256 res = _claimMapping[pro];
        return _claimBalance[res].get(ind);
    }

    // can be called by anyone, may not return anything
    function searchSamples(uint256 pro, uint256 lef, uint256 rig) public view returns (address[] memory) {
        // TODO test multiple calles to searchSample with and without overlap
        uint256[] memory ind = _claimIndices[pro];

        if (rig >= ind.length) {
            rig = ind.length;
        }

        address[] memory lis = new address[](rig - lef);

        for (uint256 i = lef; i < rig; i++) {
            address use = _indexAddress[pro][ind[i]];

            if (use == address(0)) {
                break;
            } else {
                lis[i] = use;
            }
        }

        return lis;
    }

    // can be called by anyone, may not return anything
    function searchStakers(uint256 pro, uint256 lef, uint256 rig) public view returns (address[] memory) {
        address[] memory lis = new address[](rig - lef + 1);

        uint256 max = _indexMembers[pro][CLAIM_ADDRESS_Y];
        if (lef < max && rig > max) {
            rig = max;
        }

        uint256 i = 0;
        uint256 j = lef;
        while (j <= rig) {
            address use = _indexAddress[pro][j];

            if (use == address(0)) {
                break;
            } else {
                {
                    lis[i] = use;
                }

                if (j == MAX_UINT256) {
                    break;
                } else {
                    i++;
                    j++;
                }
            }
        }

        return lis;
    }

    // can be called by anyone, may not return anything
    function searchVotes(uint256 pro) public view returns (uint256, uint256) {
        uint256 res = _claimMapping[pro];
        return (_truthResolve[res][CLAIM_TRUTH_Y], _truthResolve[res][CLAIM_TRUTH_N]);
    }
}
