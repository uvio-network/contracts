// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract Voter2 {

    enum ClaimType {
        New,
        Resolve,
        Nullify
    }

    enum ClaimStatus {
        None,
        Active,
        Resolved
    }

    uint256 public minStake;
    uint256 public minNewClaimDuration;
    uint256 public resolveDuration;
    uint256 public resolveLockupDuration;
    uint256 public resolveBond;

    // @todo - add votingExpiration (claimExpiration)
    struct Claim {
        string description;
        uint256 expiration;
        uint256 stakeYea;
        uint256 stakeNay;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimStatus status;
    }
    Claim private _claim;

    struct Resolve {
        address caller;
        uint256 bond;
        uint256 expiration;
        uint256 yeaVotes;
        uint256 nayVotes;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimType _type;
        ClaimStatus status;
    }
    Resolve private _resolve;

    mapping(address voter => mapping(bool isYea => uint256 amount)) public stakes;

    function claim(ClaimType _type, bool _yea, uint256 _expiration, string memory _description) public payable {
        if (msg.value < minStake) revert("!value");

        if (_type == ClaimType.New) {
            if (_expiration < block.timestamp + minNewClaimDuration) revert("!expiration");
            if (bytes(_description).length == 0) revert("!description");
            if (_claim.status != ClaimStatus.None) revert("active");

            stakes[msg.sender][_yea] = msg.value;

            address[] memory _voters = new address[](1);
            _voters[0] = msg.sender;
            _claim = _yea ?
                Claim(
                    _description,
                    _expiration,
                    msg.value, // stakeYea
                    0, // stakeNay
                    _voters,
                    new address[](0), // nayVoters
                    ClaimStatus.Active
                ) :
                Claim(
                    _description,
                    _expiration,
                    0, // stakeYea
                    msg.value, // stakeNay
                    new address[](0), // yeaVoters
                    _voters,
                    ClaimStatus.Active
                );
            return;
        }

        if (_expiration != 0) revert("!expiration");
        if (bytes(_description).length != 0) revert("!description");
        if (msg.value != resolveBond) revert("!bond");
        if (_claim.expiration > block.timestamp) revert("!expired");
        if (_claim.status != ClaimStatus.Active) revert("!active");
        if (_resolve.status != ClaimStatus.None) revert("active");

        _resolve = Resolve(
            msg.sender,
            msg.value, // bond
            block.timestamp + resolveDuration,
            0, // yeaVotes
            0, // nayVotes
            _claim.yeaVoters, // @todo - randomize with cap, make sure voter is not in both groups
            _claim.nayVoters, // @todo - randomize with cap, make sure voter is not in both groups
            _type, // of type Resolve/Nullify
            ClaimStatus.Active
        );
    }

    function voteOnNewClaim(bool _yea) public payable {
        if (msg.value < minStake) revert("!value");
        if (_claim.expiration < block.timestamp) revert("expired");

        stakes[msg.sender][_yea] = msg.value;

        if (_yea) {
            if (stakes[msg.sender][true] == 0) _claim.yeaVoters.push(msg.sender);
            _claim.stakeYea += msg.value;
        } else {
            if (stakes[msg.sender][false] == 0) _claim.nayVoters.push(msg.sender);
            _claim.stakeNay += msg.value;
        }
    }

    function voteOnResolve(bool _yea, bool _yeaGroup) public {
        if (_resolve.caller == address(0)) revert("!resolve");
        if (_resolve.expiration < block.timestamp) revert("expired");

        _yeaGroup ? _isInList(msg.sender, _resolve.yeaVoters) : _isInList(msg.sender, _resolve.nayVoters);
        _yea ? _resolve.yeaVotes++ : _resolve.nayVotes++;
    }

    // @todo - add reenterencyGuard
    function resolve() public {
        if (_resolve.status != ClaimStatus.Active) revert("!active");
        if (_resolve.expiration + resolveLockupDuration > block.timestamp) revert("!lockup");
        if (_resolve.yeaVotes == _resolve.nayVotes) revert("tie");

        if (_resolve.bond > 0) {
            payable(_resolve.caller).transfer(_resolve.bond); // @todo - dont use transfer. handle if is a contract without receive
            _resolve.bond = 0;
            _resolve.status = ClaimStatus.Resolved;
            _claim.status = ClaimStatus.Resolved;
        }

        if (_resolve.yeaVotes > _resolve.nayVotes) {
            if (stakes[msg.sender][true] == 0) revert("!stake");
            uint256 _amount = stakes[msg.sender][true] * _claim.stakeNay / _claim.stakeYea;
            stakes[msg.sender][true] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        } else {
            if (stakes[msg.sender][false] == 0) revert("!stake");
            uint256 _amount = stakes[msg.sender][false] * _claim.stakeYea / _claim.stakeNay;
            stakes[msg.sender][false] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        }
    }

    function dispute() public {
        // create another resolve claim
    }

    // function voteOnDispute() public {
    // function resolveDispute() public {

    function _isInList(address _addr, address[] memory _list) private pure {
        uint256 _len = _list.length;
        for (uint256 i; i < _len; i++) {
            if (_list[i] == _addr) return;
        }
        revert("!list");
    }

}