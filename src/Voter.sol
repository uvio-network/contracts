// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

contract Voter {

    event NewClaim(uint256 indexed claimID, address indexed claimer);
    event NewVote(uint256 indexed claimID, address indexed voter, bool indexed yea);
    event ResolveInitiated(uint256 indexed claimID, address indexed yeaResolver, address indexed nayResolver);
    event ResolveVoted(uint256 indexed claimID, bool indexed isYeaResolver, bool indexed yea);

    enum ClaimStatus {
        None,
        Active,
        PendingResolve,
        Resolved
    }

    enum ResolveVote {
        None,
        Yea,
        Nay
    }

    struct Claim {
        string claim;
        string resolutionSource;
        uint256 expiration;
        uint256 resolveExpiration;
        uint256 stake;
        uint256 validityBond;
        uint256 totalYea;
        uint256 totalNay;
        address claimer;
        address yeaResolver;
        address nayResolver;
        address[] yeaVoters;
        address[] nayVoters;
        ClaimStatus status;
        ResolveVote yeaResolveVote;
        ResolveVote nayResolveVote;
    }
    mapping(uint256 claimID => Claim claimData) public claims;

    struct UserShares {
        uint256 yea;
        uint256 nay;
    }
    mapping(uint256 claimID => mapping(address user => UserShares shares)) public shares;

    uint256 public claimID;
    uint256 public minStake;
    uint256 public minDuration;
    uint256 public resolveDuration;
    uint256 public validityBond;

    constructor() {}

    // @todo - format _claim and _resolutionSource (e.g. ipfs hash or something)
    function claim(
        uint256 _expiration,
        string calldata _claim,
        string calldata _resolutionSource
    ) public payable {
        if (bytes(_claim).length == 0) revert("!claim");
        if (bytes(_resolutionSource).length == 0) revert("!resolutionSource");
        if (_expiration < block.timestamp + minDuration) revert("!expiration");

        uint256 _validityBond = validityBond;
        if (msg.value < _validityBond + minStake) revert("!stake");

        uint256 _newClaimID = claimID;
        claimID = _newClaimID + 1;

        address[] memory _yeaVoters = new address[](1);
        _yeaVoters[0] = msg.sender;
        claims[_newClaimID] = Claim(
            _claim,
            _resolutionSource,
            _expiration,
            0, // resolveExpiration
            msg.value - _validityBond, // stake
            _validityBond,
            msg.value, // totalYea
            0, // totalNay
            msg.sender, // claimer
            address(0), // yeaResolver
            address(0), // nayResolver
            _yeaVoters,
            new address[](0), // nayVoters
            ClaimStatus.Active,
            ResolveVote.None, // yeaResolveVote
            ResolveVote.None // nayResolveVote
        );

        shares[_newClaimID][msg.sender] = UserShares(
            msg.value, // yea
            0 // nay
        );

        emit NewClaim(_newClaimID, msg.sender);
    }

    function vote(uint256 _claimID, bool _yea) public payable {
        if (msg.value < minStake) revert("!stake");

        Claim storage _claim = claims[_claimID];
        if (_claim.expiration < block.timestamp) revert("!expired");

        UserShares storage _userShares = shares[_claimID][msg.sender];
        if (_yea) {
            if (_userShares.yea == 0) _claim.yeaVoters.push(msg.sender);
            _claim.totalYea += msg.value;
            _userShares.yea += msg.value;
        } else {
            if (_userShares.nay == 0) _claim.nayVoters.push(msg.sender);
            _claim.totalNay += msg.value;
            _userShares.nay += msg.value;
        }

        emit NewVote(_claimID, msg.sender, _yea);
    }

    function initiateResolve(uint256 _claimID) public {
        Claim memory _claim = claims[_claimID];
        if (_claim.expiration >= block.timestamp) revert("!expired");
        if (_claim.status != ClaimStatus.Active) revert("!active");

        claims[_claimID].status = ClaimStatus.PendingResolve;

        // @todo - figure out out which group has less voters, and pick this amount of voters from each group (100/10, pick 10). also add some cap 
        // @todo - make sure _yeaVoter != _nayVoter
        address _yeaVoter = _claim.yeaVoters[0]; // @todo - randomize
        address _nayVoter = _claim.nayVoters[0]; // @todo - randomize
        claims[_claimID].yeaResolver = _yeaVoter;
        claims[_claimID].nayResolver = _nayVoter;
        claims[_claimID].resolveExpiration = block.timestamp + resolveDuration;

        emit ResolveInitiated(_claimID, _yeaVoter, _nayVoter);
    }

    // @todo - if no one votes, penalize all voters
    // @todo - if i didnt vote, penalize me
    function resolveVote(uint256 _claimID, bool _yea) public {
        Claim memory _claim = claims[_claimID];
        if (msg.sender != _claim.yeaResolver && msg.sender != _claim.nayResolver) revert("!resolver");
        if (_claim.status != ClaimStatus.PendingResolve) revert("!pendingResolve");
        if (_claim.resolveExpiration < block.timestamp) revert("expired");

        bool _isYeaVoter = msg.sender == _claim.yeaResolver ? true : false;
        ResolveVote _resolveVote = _yea ? _claim.yeaResolveVote : _claim.nayResolveVote;
        if (_isYeaVoter) {
            claims[_claimID].yeaResolveVote = _resolveVote;
        } else {
            claims[_claimID].nayResolveVote = _resolveVote;
        }

        emit ResolveVoted(_claimID, _isYeaVoter, _yea);
    }

    // @todo - if at least one person voted, we might be able to _resolve
    // if there's not tie, we can _resolve
    // otherwise, we _dispute
    function endResolve(uint256 _claimID) public {
        Claim memory _claim = claims[_claimID];
        if (_claim.resolveExpiration >= block.timestamp) revert("!expired");
        // check if both voters said the same thing
        bool _isResolved = _claim.yeaResolveVote != _claim.nayResolveVote;
        if (_claim.yeaResolveVote == ResolveVote.None || _claim.nayResolveVote == ResolveVote.None || !_isResolved) {
            _dispute(_claimID);
        } else {
            _resolve(_claimID, _isResolved);
        }
    }

    // @todo same process
    // function dispute

    // function _convertToShares(uint256 _amount, uint256 _totalAmount, uint256 _totalShares) internal pure returns (uint256 _result) {
    //     if (_totalShares == 0 || _totalAmount == 0) return _amount;
    //     _result = _amount * _totalShares / _totalAmount;
    //     if (_result == 0 && _amount != 0) revert ("ZeroShares");
    // }
}