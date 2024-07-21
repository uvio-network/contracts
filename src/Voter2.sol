// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

// 1. claim() -- is it a new claim, or is it a claim on a resolve-claim
// if it's on a resolve-claim, is it a claim that 

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
    uint256 public resolveBond;

    struct Claim {
        string description;
        uint256 expiration;
        uint256 stakeYea;
        uint256 stakeNay;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimStatus status;
    }
    Claim public claim;

    struct Resolve {
        address caller;
        uint256 expiration;
        uint256 yeaVotes;
        uint256 nayVotes;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimType _type;
        ClaimStatus status;
    }
    Resolve public resolve;

    mapping(address voter => mapping(bool isYea => uint256 amount)) public stakes;

    function initiateClaim(ClaimType _type, bool _yea, uint256 _expiration, string memory _description) public payable {
        if (msg.value < minStake) revert("!value");

        if (_type == ClaimType.New) {
            if (_expiration < block.timestamp + minNewClaimDuration) revert("!expiration");
            if (bytes(_description).length == 0) revert("!description");
            if (claim.status != ClaimStatus.None) revert("active");

            stakes[msg.sender][true] = msg.value;

            address[] memory _voters = new address[](1);
            _voters[0] = msg.sender;
            claim = _yea ?
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
        if (claim.expiration > block.timestamp) revert("!expired");

        resolve = Resolve(
            msg.sender,
            block.timestamp + resolveDuration,
            0, // yeaVotes
            0, // nayVotes
            claim.yeaVoters, // @todo - randomize with cap, make sure voter is not in both groups
            claim.nayVoters, // @todo - randomize with cap, make sure voter is not in both groups
            _type, // of type Resolve/Nullify
            ClaimStatus.Active
        );
    }

    function voteOnNewClaim(bool _yea) public payable {
        if (msg.value < minStake) revert("!value");
        if (claim.expiration < block.timestamp) revert("expired");

        if (_yea) {
            if (stakes[msg.sender][true] == 0) claim.yeaVoters.push(msg.sender);
            stakes[msg.sender][true] = msg.value;
            claim.stakeYea += msg.value;
        } else {
            if (stakes[msg.sender][false] == 0) claim.nayVoters.push(msg.sender);
            stakes[msg.sender][false] = msg.value;
            claim.stakeNay += msg.value;
        }
    }

    function voteOnResolve(bool _yea, bool _yeaGroup) public {
        if (resolve.caller == address(0)) revert("!resolve");

        _yeaGroup ? _isInList(msg.sender, resolve.yeaVoters) : _isInList(msg.sender, resolve.nayVoters);
        _yea ? resolve.yeaVotes++ : resolve.nayVotes++;
    }

    function initiateResolve() public {
        if (resolve.status != ClaimStatus.Active) revert("!active");
        if (resolve.expiration < block.timestamp) revert("!expired");
        if (resolve.yeaVotes == resolve.nayVotes) {
            _dispute();
        } else {
            resolve.status = ClaimStatus.Resolved;
        }
    }

    function _dispute() internal {
        // create another resolve claim
    }

    function _resolve() internal {
        // a resolution has been made
    }

    function _isInList(address _addr, address[] memory _list) private pure {
        uint256 _len = _list.length;
        for (uint256 i; i < _len; i++) {
            if (_list[i] == _addr) return;
        }
        revert("!list");
    }

}