// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract Voter4 {

    enum Status {
        None,
        Active,
        PendingResolution
    }

    enum Outcome {
        None,
        Yea,
        Nay,
        Tie
    }

    struct Stake {
        uint256 yea;
        uint256 nay;
        uint256 expiration;
        address[] yeaStakers;
        address[] nayStakers;
    }

    struct Vote {
        uint256 yea;
        uint256 nay;
        uint256 expiration;
        uint256 disputeExpiration;
        address[] yeaVoters;
        address[] nayVoters;
        Outcome voteOutcome;
        Outcome resolutionOutcome;
    }

    struct Claim {
        string description;
        uint256 expiration;
        Stake stake;
        Vote vote;
        Status status;
    }

    Claim[] private _claims;

    uint256 public maxClaims = 5;
    uint256 public minStake = 1 ether;
    uint256 public votersLimit = 5;
    uint256 public votingDuration = 1 days;
    uint256 public disputeDuration = 1 days;
    bool public resolved = false;

    mapping(bytes32 => uint256) public stakes;
    mapping(bytes32 => bool) public isVoted;

    function propose(string memory _description, uint256 _claimExpiration, uint256 _stakingExpiration) public payable {
        if (msg.value < minStake) revert();
        if (_claimExpiration < block.timestamp) revert();
        if (_stakingExpiration < _claimExpiration) revert();
        if (bytes(_description).length == 0) revert();
        if (_claims.length >= maxClaims) revert();
        if (_claims[_claims.length].status == Status.Active) revert();
        if (resolved) revert();

        stakes[userStakeKey(_claims.length, msg.sender, true)] = msg.value;

        address[] memory _yeaStakers = new address[](1);
        _yeaStakers[0] = msg.sender;
        _claims.push(Claim({
            description: _description,
            expiration: _claimExpiration,
            stake: Stake({
                yea: msg.value,
                nay: 0,
                expiration: _stakingExpiration,
                yeaStakers: _yeaStakers,
                nayStakers: new address[](0)
            }),
            vote: Vote({
                yea: 0,
                nay: 0,
                expiration: 0,
                disputeExpiration: 0,
                yeaVoters: new address[](0),
                nayVoters: new address[](0),
                voteOutcome: Outcome.None,
                resolutionOutcome: Outcome.None
            }),
            status: Status.Active
        }));
    }

    function stake(bool _yea) public payable {
        if (msg.value < minStake) revert();

        uint256 _claimId = _claims.length - 1;
        Claim storage _claim = _claims[_claimId];
        if (_claim.stake.expiration < block.timestamp) revert();

        if (_yea) {
            if (stakes[userStakeKey(_claimId, msg.sender, true)] == 0) _claim.stake.yeaStakers.push(msg.sender);
            _claim.stake.yea += msg.value;
        } else {
            if (stakes[userStakeKey(_claimId, msg.sender, false)] == 0) _claim.stake.nayStakers.push(msg.sender);
            _claim.stake.nay += msg.value;
        }
    }

    function prepareVote() public {

        uint256 _claimId = _claims.length - 1;
        Claim storage _claim = _claims[_claimId];
        if (_claim.expiration < block.timestamp) revert();

        uint256 _votersLength = min(min(_claim.stake.yeaStakers.length, _claim.stake.nayStakers.length), votersLimit);
        address[] memory _yeaVoters = new address[](_votersLength);
        address[] memory _nayVoters = new address[](_votersLength);
        for (uint256 i = 0; i < _votersLength; i++) { // @todo - randomize and make sure voter is not in both groups
            _yeaVoters[i] = _claim.stake.yeaStakers[i];
            _nayVoters[i] = _claim.stake.nayStakers[i];
        }

        _claim.vote = Vote({
            yea: 0,
            nay: 0,
            expiration: block.timestamp + votingDuration,
            disputeExpiration: 0,
            yeaVoters: _yeaVoters,
            nayVoters: _nayVoters,
            voteOutcome: Outcome.None,
            resolutionOutcome: Outcome.None
        });
    }

    function vote(bool _yea, bool _yeaGroup) public {

        uint256 _claimId = _claims.length - 1;
        Claim storage _claim = _claims[_claimId];
        if (_claim.vote.expiration < block.timestamp) revert();
        if (isVoted[userIsVotedKey(_claimId, msg.sender)]) revert();

        _yeaGroup ? _isInList(msg.sender, _claim.vote.yeaVoters) : _isInList(msg.sender, _claim.vote.nayVoters);

        isVoted[userIsVotedKey(_claimId, msg.sender)] = true;

        _yea ? _claim.vote.yea += 1 : _claim.vote.nay += 1;
    }

    function endVote() public {

        uint256 _claimId = _claims.length - 1;
        Claim storage _claim = _claims[_claimId];
        if (_claim.vote.expiration < block.timestamp) revert();

        if (_claim.vote.yea > _claim.vote.nay) {
            _claim.vote.voteOutcome = Outcome.Yea;
        } else if (_claim.vote.yea < _claim.vote.nay) {
            _claim.vote.voteOutcome = Outcome.Nay;
        } else {
            _claim.vote.voteOutcome = Outcome.Tie;
        }

        _claim.vote.disputeExpiration = block.timestamp + disputeDuration;
        _claim.status = Status.PendingResolution;
    }

    function resolve() public {
        uint256 _claimId = _claims.length - 1;
        Claim storage _lastClaim = _claims[_claimId];
        if (_lastClaim.vote.disputeExpiration < block.timestamp) revert();

        resolved = true;

        while (_claimId >= 0) {
            Claim storage _claim = _claims[_claimId];
            if (_lastClaim.vote.voteOutcome == Outcome.Yea) {
                _claim.vote.resolutionOutcome = Outcome.Yea;
            } else if (_lastClaim.vote.voteOutcome == Outcome.Nay) {
                _claim.vote.resolutionOutcome = Outcome.Nay;
            } else {
                _claim.vote.resolutionOutcome = Outcome.Tie;
            }
            _claimId -= 1;
        }
    }

    // function claimRewards(uint256 _claimId) public {

    function userStakeKey(uint256 _claimId, address _user, bool _yea) public pure returns (bytes32) {
        return keccak256(abi.encode(_claimId, _user, _yea));
    }

    function userIsVotedKey(uint256 _claimId, address _user) public pure returns (bytes32) {
        return keccak256(abi.encode(_claimId, _user));
    }

    function min(uint256 a, uint256 b) public pure returns (uint256) {
        return a < b ? a : b;
    }

    function _isInList(address _addr, address[] memory _list) private pure {
        uint256 _len = _list.length;
        for (uint256 i; i < _len; i++) {
            if (_list[i] == _addr) return;
        }
        revert();
    }
}

// 1. claim
// 2. stake
// 3. vote
// ...wait... --> 1. claim
//                2. stake
//                3. vote
//                ...wait... --> 1. claim
//                               2. stake
//                               3. vote
//                               ...wait... --> 1. claim
//                                              2. stake
//                                              3. vote
//                                              ...wait... --> 1. claim
//                                                             2. go to committee
//                                              4. resolve
//                               4. resolve
//                4. resolve
// 4. resolve

