// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract Voter3 {

    enum ResolutionType {
        Resolve,
        Nullify
    }

    enum ClaimStatus {
        None,
        Active,
        Resolved
    }

    struct Claim {
        string description;
        uint256 claimExpiration;
        uint256 votingExpiration;
        uint256 stakeYea;
        uint256 stakeNay;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimStatus status;
    }
    Claim private _claim;

    struct Resolution {
        address caller;
        uint256 bond;
        uint256 expiration;
        uint256 yeaVotes;
        uint256 nayVotes;
        address[] yeaVoters;
        address[] nayVoters;
        ResolutionType resolutionType;
        ClaimStatus status;
    }
    Resolution private _resolution;
    Resolution private _dispute;

    uint256 public minStake;
    uint256 public minClaimDuration;
    uint256 public minVotingDuration;
    uint256 public resolutionDuration;
    uint256 public resolveLockupDuration;
    uint256 public resolutionBond;

    mapping(address voter => mapping(bool isYea => uint256 amount)) public stakes;

    function proposeClaim(bool _yea, uint256 _claimExpiration, uint256 _votingExpiration, string memory _description) public payable {
        if (_claimExpiration < block.timestamp + minClaimDuration) revert();
        if (_votingExpiration < _claimExpiration + minVotingDuration) revert();
        if (bytes(_description).length == 0) revert();
        if (_claim.status != ClaimStatus.None) revert();
        if (msg.value < minStake) revert();

        stakes[msg.sender][_yea] = msg.value;

        address[] memory _voters = new address[](1);
        _voters[0] = msg.sender;
        _claim = _yea ?
            Claim(
                _description,
                _claimExpiration,
                _votingExpiration,
                msg.value, // stakeYea
                0, // stakeNay
                _voters,
                new address[](0), // nayVoters
                ClaimStatus.Active
            ) :
            Claim(
                _description,
                _claimExpiration,
                _votingExpiration,
                0, // stakeYea
                msg.value, // stakeNay
                new address[](0), // yeaVoters
                _voters,
                ClaimStatus.Active
            );
    }

    function voteOnClaim(bool _yea) public payable {
        if (_claim.votingExpiration < block.timestamp) revert();
        if (msg.value < minStake) revert();

        stakes[msg.sender][_yea] = msg.value;

        if (_yea) {
            if (stakes[msg.sender][true] == 0) _claim.yeaVoters.push(msg.sender);
            _claim.stakeYea += msg.value;
        } else {
            if (stakes[msg.sender][false] == 0) _claim.nayVoters.push(msg.sender);
            _claim.stakeNay += msg.value;
        }
    }

    function proposeResolution(ResolutionType _type) public payable {
        if (_claim.votingExpiration > block.timestamp) revert();
        if (msg.value != resolutionBond) revert();
        if (_claim.status != ClaimStatus.Active) revert();
        if (_resolution.status != ClaimStatus.None) revert();

        _resolution = Resolution({
            caller: msg.sender,
            bond: msg.value,
            expiration: block.timestamp + resolutionDuration,
            yeaVotes: 0,
            nayVotes: 0,
            yeaVoters: _claim.yeaVoters, // @todo - randomize with cap, make sure voter is not in both groups
            nayVoters: _claim.nayVoters, // @todo - randomize with cap, make sure voter is not in both groups
            resolutionType: _type,
            status: ClaimStatus.Active
        });
    }

    function voteOnResolution(bool _yea, bool _yeaGroup) public {
        if (_resolution.status != ClaimStatus.Active) revert();
        if (_resolution.expiration < block.timestamp) revert();

        _yeaGroup ? _isInList(msg.sender, _resolution.yeaVoters) : _isInList(msg.sender, _resolution.nayVoters);
        _yea ? _resolution.yeaVotes++ : _resolution.nayVotes++;
    }

    function resolveResolution() public {
        if (_dispute.status == ClaimStatus.Resolved || _dispute.status == ClaimStatus.None) revert();
        if (_resolution.status != ClaimStatus.Active) revert();
        if (_resolution.expiration + resolveLockupDuration > block.timestamp) revert();
        if (_resolution.yeaVotes == _resolution.nayVotes) revert();

        if (_resolution.bond > 0) {
            payable(_resolution.caller).transfer(_resolution.bond); // @todo - dont use transfer. handle if is a contract without receive
            _resolution.bond = 0;
        }

        // @todo - fees
        if (_resolution.yeaVotes > _resolution.nayVotes) {
            if (stakes[msg.sender][true] == 0) revert();
            uint256 _amount = stakes[msg.sender][true] * _claim.stakeNay / _claim.stakeYea;
            stakes[msg.sender][true] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        } else {
            if (stakes[msg.sender][false] == 0) revert();
            uint256 _amount = stakes[msg.sender][false] * _claim.stakeYea / _claim.stakeNay;
            stakes[msg.sender][false] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        }
    }

    function proposeDispute1(ResolutionType _type) public payable {
        if (_claim.votingExpiration > block.timestamp) revert();
        if (msg.value != resolutionBond) revert();
        if (_resolution.status != ClaimStatus.Active) revert();

        _dispute = Resolution({
            caller: msg.sender,
            bond: msg.value,
            expiration: block.timestamp + resolutionDuration,
            yeaVotes: 0,
            nayVotes: 0,
            yeaVoters: _resolution.yeaVoters, // @todo - randomize with cap, make sure voter is not in both groups
            nayVoters: _resolution.nayVoters, // @todo - randomize with cap, make sure voter is not in both groups
            resolutionType: _type,
            status: ClaimStatus.Active
        });
    }

    function voteOnDispute1(bool _yea, bool _yeaGroup) public {
        if (_dispute.status != ClaimStatus.Active) revert();
        if (_dispute.expiration < block.timestamp) revert();

        _yeaGroup ? _isInList(msg.sender, _dispute.yeaVoters) : _isInList(msg.sender, _dispute.nayVoters);
        _yea ? _dispute.yeaVotes++ : _dispute.nayVotes++;
    }

    function resolveDispute1() public {
        if (_dispute.status != ClaimStatus.Active) revert();
        if (_dispute.expiration + resolveLockupDuration > block.timestamp) revert();
        if (_dispute.yeaVotes == _dispute.nayVotes) revert();

        if (_dispute.bond > 0) {
            payable(_dispute.caller).transfer(_dispute.bond); // @todo - dont use transfer. handle if is a contract without receive
            _dispute.bond = 0;
        }

        // @todo - fees
        if (_dispute.yeaVotes > _dispute.nayVotes) {
            if (stakes[msg.sender][true] == 0) revert();
            uint256 _amount = stakes[msg.sender][true] * _claim.stakeNay / _claim.stakeYea;
            stakes[msg.sender][true] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        } else {
            if (stakes[msg.sender][false] == 0) revert();
            uint256 _amount = stakes[msg.sender][false] * _claim.stakeYea / _claim.stakeNay;
            stakes[msg.sender][false] = 0;
            payable(msg.sender).transfer(_amount); // @todo - dont use transfer. handle if is a contract without receive (just use WETH)
        }
    }
    // function proposeDispute2
    // function voteOnDispute2
    // function resolveDispute2
    // function proposeDispute3
    // function voteOnDispute3
    // function resolveDispute3
    // function finalBoss

    function _isInList(address _addr, address[] memory _list) private pure {
        uint256 _len = _list.length;
        for (uint256 i; i < _len; i++) {
            if (_list[i] == _addr) return;
        }
        revert();
    }
}