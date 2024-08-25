// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {BitMaps} from "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Claims {
    //
    // EXTENSIONS
    //

    //
    using BitMaps for BitMaps.BitMap;
    //
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    //
    using EnumerableMap for EnumerableMap.UintToAddressMap;

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
    // CONSTANTS
    //

    // CHALLENGE_PERIOD represents 7 days in seconds. This is the amount of time
    // that any claim of lifecycle phase "resolve" can be challenged. Only after
    // the resolving claim expired, and only after this challenge period is over
    // on top of the mentioned expiry, only then can a claim be finalized and
    // user balances be updated.
    uint48 private constant CHALLENGE_PERIOD = 604_800;
    //
    uint48 private constant DAY_SECONDS = 86_400;
    // PROPOSER_BASIS is the amount of proposer fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that users may earn by creating
    // claims.
    uint48 private constant PROPOSER_BASIS = 500;
    // PROTOCOL_BASIS is the amount of protocol fees in basis points, which are
    // deducted from the total pool of funds before updating user balances upon
    // market resolution. This is the amount that the protocol earns by
    // providing its services.
    uint48 private constant PROTOCOL_BASIS = 500;

    // VOTE_STAKE_Y is the boolean flag for users who expressed their opinions
    // by staking in agreement with the proposed claim.
    uint8 private constant VOTE_STAKE_Y = 0;
    // VOTE_STAKE_N is the boolean flag for users who expressed their opinions
    // by staking in disagreement with the proposed claim.
    uint8 private constant VOTE_STAKE_N = 1;
    // VOTE_TRUTH_Y is the boolean flag for users who verified real events by
    // voting for the proposed claim to be true.
    uint8 private constant VOTE_TRUTH_Y = 2;
    // VOTE_TRUTH_N is the boolean flag for users who verified real events by
    // voting for the proposed claim to be false.
    uint8 private constant VOTE_TRUTH_N = 3;
    // VOTE_TRUTH_S is the boolean flag for users who have been selected and
    // authorized to vote in the random truth sampling process.
    uint8 private constant VOTE_TRUTH_S = 4;
    // VOTE_TRUTH_V is the boolean flag for users who have cast their vote
    // already.
    uint8 private constant VOTE_TRUTH_V = 5;
    // VOTE_TRUTH_U is the boolean flag for users who have been processed and
    // whos' balances have been updated already.
    uint8 private constant VOTE_TRUTH_U = 6;

    //
    // MAPPINGS
    //

    //
    mapping(uint256 => EnumerableMap.AddressToUintMap) private _addressStake;
    //
    mapping(uint256 => mapping(address => BitMaps.BitMap)) private _addressVotes;
    //
    mapping(address => uint256) private _allocBalance;
    //
    mapping(address => uint256) private _availBalance;
    //
    mapping(uint256 => uint48) private _claimExpired;
    //
    mapping(uint256 => uint256[]) private _claimIndices;
    //
    mapping(uint256 => uint256) private _claimResolve;
    //
    mapping(uint256 => EnumerableMap.UintToAddressMap) private _indexAddress;
    //
    mapping(uint256 => mapping(uint8 => uint256)) private _truthResolve;
    //
    mapping(uint256 => mapping(uint8 => uint256)) private _stakePropose;

    //
    // VARIABLES
    //

    // owner is the owner address of the privileged entity receiving protocol
    // fees.
    address owner = address(0);
    // token is the token address for this instance of the deployed contract.
    // That means every deployed contract is only responsible for serving claims
    // denominated in any given token address.
    address token = address(0);

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
    }

    //
    receive() external payable {
        if (msg.value != 0) {
            revert Balance("invalid token", 0);
        }
    }

    //
    // MODIFIERS
    //

    //
    modifier onlyAmount(uint256 pro, uint256 bal, address use) {
        // Look for the very first deposit related to the given claim. If this
        // call is for the very first deposit itself, then there is no minimum
        // balance to check against. In that very first case we simply check the
        // given balance against 0, which allows the creator of the claim to
        // define the minimum stake required to participate in this market.

        (, address fir) = _indexAddress[pro].tryGet(0);
        (, uint256 min) = _addressStake[pro].tryGet(fir);

        if (bal < min) {
            revert Balance("below minimum", min);
        }

        _;
    }

    //
    modifier onlyPaired(uint256 pro, uint256 res) {
        if (_claimResolve[pro] != res) {
            revert Mapping("not related");
        }

        _;
    }

    //
    modifier onlyVoters(uint256 pro, address use) {
        if (!_addressVotes[pro][use].get(VOTE_TRUTH_S)) {
            revert Address("not allowed");
        }

        if (_addressVotes[pro][use].get(VOTE_TRUTH_V)) {
            revert Address("already voted");
        }

        _;
    }

    //
    // PUBLIC
    //

    // called by anyone
    function createPropose(
        uint256 pro,
        uint256 bal,
        bool vot,
        uint48 exp
    )
        public
        onlyAmount(pro, bal, msg.sender)
    {
        // Set the given expiry to make the code flow below work.
        if (_claimExpired[pro] == 0) {
            _claimExpired[pro] = exp;
        }

        // The first user creating a claim must define an expiry that is at
        // least 1 day in the future. Once a claim was created its expiry starts
        // to run out. Users can only keep staking as long as the claim they
        // want to stake on did not yet expire.
        if (_claimExpired[pro] <= Time.timestamp() + DAY_SECONDS) {
            revert Expired("propose expired", _claimExpired[pro]);
        }

        address use = msg.sender;

        // Do the transfer right at the top, because this is the last thing that
        // can actually fail.
        if (!IERC20(token).transferFrom(use, address(this), bal)) {
            revert Balance("transfer failed", bal);
        }

        // Track the user's allocated balance so we can tell people where they
        // stand any time. The allocated balances are all funds that are
        // currently bound in active markets. The user's available balance does
        // not change here because the user is directly staking their deposited
        // balance when participating in a market. Only later may available
        // balances increase, if a user may be rewarded after claims have been
        // resolved.
        {
            _allocBalance[use] += bal;
        }

        // Track the stakers expressed opinion by remembering the side they
        // picked using the boolean voting flag. True means the user agrees with
        // the given statement. False means the user disagrees respectively. We
        // do also account for the cumulative balances on either side of the
        // bet, so we can write this kind of data once and read it for cheap
        // many times later on when updating user balances.
        if (vot) {
            _addressVotes[pro][use].set(VOTE_STAKE_Y);
            _stakePropose[pro][VOTE_STAKE_Y] += bal;
        } else {
            _addressVotes[pro][use].set(VOTE_STAKE_N);
            _stakePropose[pro][VOTE_STAKE_N] += bal;
        }

        (bool exi, uint256 cur) = _addressStake[pro].tryGet(use);
        if (exi) {
            _addressStake[pro].set(use, cur + bal);
        } else {
            _addressStake[pro].set(use, bal);
            _indexAddress[pro].set(_indexAddress[pro].length(), use);
        }
    }

    function withdraw(uint256 bal) public {
        address use = msg.sender;
        uint256 avl = _availBalance[use];

        if (avl < bal) {
            revert Balance("insufficient funds", avl);
        }

        if (!IERC20(token).transferFrom(address(this), use, bal)) {
            revert Balance("transfer failed", bal);
        }

        {
            _availBalance[use] -= bal;
        }
    }

    //
    // PUBLIC PRIVILEGED
    //
    function createResolve(uint256 pro, uint256 res, uint256[] memory ind, uint48 exp) public {
        if (_claimExpired[res] != 0) {
            revert Expired("resolve allocated", _claimExpired[res]);
        }

        if (_claimExpired[pro] > Time.timestamp()) {
            revert Expired("propose active", _claimExpired[pro]);
        }

        for (uint256 i = 0; i < ind.length; i++) {
            address use = _indexAddress[pro].get(ind[i]);
            _addressVotes[pro][use].set(VOTE_TRUTH_S);
        }

        {
            _claimExpired[res] = exp;
            _claimIndices[res] = ind;
            _claimResolve[pro] = res;
        }
    }

    // TODO handle nullify and dispute

    // called by some privileged bot
    function updateBalance(
        uint256 pro,
        uint256 res,
        uint256 lef,
        uint256 rig
    )
        public
        onlyPaired(pro, res)
        returns (bool)
    {
        if (_claimExpired[res] == 0) {
            revert Expired("resolve unallocated", _claimExpired[res]);
        }

        if (_claimExpired[res] > Time.timestamp()) {
            revert Expired("resolve active", _claimExpired[res]);
        }

        if (_claimExpired[res] + CHALLENGE_PERIOD <= Time.timestamp()) {
            revert Expired("challenge active", _claimExpired[res] + CHALLENGE_PERIOD);
        }

        // Lookup the amounts of votes that we have recorded on either side. It
        // may very well be that there are no votes or that we have a tied
        // result. In those undesired cases, we punish those users who where
        // selected by the random truth sampling process, simply by taking all
        // of their staked balances away.
        uint256 yay = _truthResolve[res][VOTE_TRUTH_Y];
        uint256 nah = _truthResolve[res][VOTE_TRUTH_N];

        bool don = false;
        if (yay + nah == 0 || yay == nah) {
            don = updatePunish(pro, lef, rig);
        } else {
            // TODO we should somehow be able to check from the outside whether a
            // resolution was rewarded or punished
            don = updateReward(pro, lef, rig, yay, nah);
        }

        // Only credit the proposer and the protocol once everyone else got
        // accounted for. The proposer is always the very first user, because
        // they created the claim.
        if (don) {
            address first = _indexAddress[pro].get(0);
            uint256 total = _stakePropose[pro][VOTE_STAKE_Y] + _stakePropose[pro][VOTE_STAKE_N];

            _availBalance[first] += (total * PROPOSER_BASIS) / 100;
            _availBalance[owner] += (total * PROTOCOL_BASIS) / 100;
        }

        // TODO ensure balances cannot be updated anymore once everything got
        // accounted for

        return don;
    }

    // any whitelisted user can call
    function updateResolve(
        uint256 pro,
        uint256 res,
        bool vot
    )
        public
        onlyPaired(pro, res)
        onlyVoters(pro, msg.sender)
    {
        if (_claimExpired[res] == 0) {
            revert Expired("resolve unallocated", _claimExpired[res]);
        }

        if (_claimExpired[res] <= Time.timestamp()) {
            revert Expired("resolve expired", _claimExpired[res]);
        }

        address use = msg.sender;

        if (vot) {
            _addressVotes[pro][use].set(VOTE_TRUTH_Y);
            _truthResolve[res][VOTE_TRUTH_Y]++;
        } else {
            _addressVotes[pro][use].set(VOTE_TRUTH_N);
            _truthResolve[res][VOTE_TRUTH_N]++;
        }

        {
            _addressVotes[pro][use].set(VOTE_TRUTH_V);
        }
    }

    //
    // PRIVATE
    //

    // TODO this result cannot be disputed
    function updatePunish(uint256 pro, uint256 lef, uint256 rig) private returns (bool) {
        bool don = false;

        uint256 len = _indexAddress[pro].length();
        if (rig >= len) {
            don = true;
            rig = len;
        }

        for (uint256 i = lef; i < rig; i++) {
            address use = _indexAddress[pro].get(i);
            uint256 bal = _addressStake[pro].get(use);

            bool sel = _addressVotes[pro][use].get(VOTE_TRUTH_S);
            bool upd = _addressVotes[pro][use].get(VOTE_TRUTH_U);

            // We keep track of every user that we processed and updated balances
            // for already. If it ever were to happen that the same user was
            // attempted to be updated twice, then we simply acknowledge that fact
            // here and continue with the next user, without processing any balance
            // twice.
            if (upd) {
                continue;
            }

            // Every user loses their allocated balance when claims get
            // resolved. In the punishment case only those users who were not
            // authorized by the random truth sampling process get their staked
            // balance returned, minus fees.
            {
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
                _availBalance[owner] += deductFees(bal);
            }

            if (!sel) {
                _availBalance[use] += deductFees(bal);
            }

            // At the end of the processing loop, remember which users we have
            // updated already.
            {
                _addressVotes[pro][use].set(VOTE_TRUTH_U);
            }
        }

        return don;
    }

    function updateReward(
        uint256 pro,
        uint256 lef,
        uint256 rig,
        uint256 yay,
        uint256 nah
    )
        private
        returns (bool)
    {
        bool don = false;
        bool win = yay > nah;

        // Calculate the amounts for total staked assets on either side by
        // deducting all relevant fees. The total staked assets are used as
        // basis for calculating user rewards below, respective to their
        // individual share of the winning pool and the captured amount from the
        // loosing side.
        uint256 tsy = deductFees(_stakePropose[pro][VOTE_STAKE_Y]);
        uint256 tsn = deductFees(_stakePropose[pro][VOTE_STAKE_N]);

        uint256 len = _indexAddress[pro].length();
        if (rig >= len) {
            don = true;
            rig = len;
        }

        for (uint256 i = lef; i < rig; i++) {
            address use = _indexAddress[pro].get(i);
            uint256 bal = _addressStake[pro].get(use);

            bool upd = _addressVotes[pro][use].get(VOTE_TRUTH_U);
            bool vsy = _addressVotes[pro][use].get(VOTE_STAKE_Y);
            bool vsn = _addressVotes[pro][use].get(VOTE_STAKE_N);

            // We keep track of every user that we processed and updated balances
            // for already. If it ever were to happen that the same user was
            // attempted to be updated twice, then we simply acknowledge that fact
            // here and continue with the next user, without processing any balance
            // twice.
            if (upd) {
                continue;
            }

            // Every user loses their allocated balance when claims get resolved.
            // Only those users who were right in the end regain their allocated
            // balances in the form of available balances, plus rewards.
            {
                _allocBalance[use] -= bal;
            }

            // After verifying events in the real world the majority of voters
            // decided that the proposed claim turned out to be true. Everyone
            // staking reputation in agreement with the proposed claim will now earn
            // their share of rewards. The users' staked balances plus rewards
            // become now part of the respective available balances.
            if (win && vsy) {
                uint256 shr = (bal * 100) / tsy;
                uint256 rew = (shr * tsn) / 100;

                _availBalance[use] += (rew + bal);
            }

            // After verifying events in the real world the majority of voters
            // decided that the proposed claim turned out to be false. Everyone
            // staking reputation in disagreement with the proposed claim will now
            // earn their share of rewards. The users' staked balances plus rewards
            // become now part of the respective available balances.
            if (!win && vsn) {
                uint256 shr = (bal * 100) / tsn;
                uint256 rew = (shr * tsy) / 100;

                _availBalance[use] += (rew + bal);
            }

            // At the end of the processing loop, remember which users we have
            // updated already.
            {
                _addressVotes[pro][use].set(VOTE_TRUTH_U);
            }
        }

        return don;
    }

    //
    // PUBLIC VIEW
    //

    //
    function deductFees(uint256 tot) public pure returns (uint256) {
        return ((tot * (10_000 - (PROPOSER_BASIS + PROTOCOL_BASIS))) / 100);
    }

    // can be called by anyone, may not return anything
    function searchBalance(address use) public view returns (uint256, uint256) {
        return (_allocBalance[use], _availBalance[use]);
    }

    // can be called by anyone, may not return anything
    function searchMaximum(uint256 pro) public view returns (uint256) {
        return _indexAddress[pro].length();
    }

    // can be called by anyone, may not return anything
    function searchSample(
        uint256 pro,
        uint256 res
    )
        public
        view
        onlyPaired(pro, res)
        returns (address[] memory)
    {
        uint256[] memory ind = _claimIndices[res];
        address[] memory lis = new address[](ind.length);

        for (uint256 i = 0; i < ind.length; i++) {
            lis[i] = _indexAddress[pro].get(ind[i]);
        }

        return lis;
    }

    // can be called by anyone, may not return anything
    function searchStaker(uint256 pro) public view returns (address[] memory) {
        uint256 len = _indexAddress[pro].length();
        address[] memory lis = new address[](len);

        for (uint256 i = 0; i < len; i++) {
            lis[i] = _indexAddress[pro].get(i);
        }

        return lis;
    }
}
