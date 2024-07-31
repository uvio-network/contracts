// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMarket} from "../src/interfaces/IMarket.sol";

import {Randomizer} from "../src/utils/Randomizer.sol";

import {Storage} from "../src/Storage.sol";
import {ClaimMarket} from "../src/ClaimMarket.sol";
import {NullifyMarket} from "../src/NullifyMarket.sol";
import {BaseMarket} from "../src/BaseMarket.sol";

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract Deploy is Script {

    address public deployer;

    Randomizer public randomizer;

    Storage public s;
    ClaimMarket public claimMarket;
    NullifyMarket public nullifyMarket;

    address public asset = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH

    uint256 public constant MAX_CLAIMS = 4;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant MIN_STAKE_INCREASE = 10_000;
    uint256 public constant MIN_CLAIM_DURATION = 1 weeks;
    uint256 public constant VOTERS_LIMIT = 5;
    uint256 public constant VOTING_DURATION = 3 days;
    uint256 public constant DISPUTE_DURATION = 3 days;
    uint256 public constant FEE = 1_000; // 10%
    uint256 public constant HALVES = 10;

    function run() public {

        uint256 _pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        VmSafe.Wallet memory _wallet = vm.createWallet(_pk);
        deployer = _wallet.addr;

        vm.startBroadcast(_pk);

        _deployContracts(deployer);

        vm.stopBroadcast();

        // _printAddresses();
        _labelContracts();
    }

    function _deployContracts(address _deployer) internal {

        s = new Storage(
            _deployer, // owner
            asset
        );

        IMarket.Initialize memory _init = IMarket.Initialize(
            MAX_CLAIMS,
            MIN_STAKE,
            MIN_STAKE_INCREASE,
            MIN_CLAIM_DURATION,
            VOTERS_LIMIT,
            VOTING_DURATION,
            DISPUTE_DURATION,
            FEE,
            HALVES,
            address(s),
            _deployer, // owner
            address(0) // randomizer
        );
        nullifyMarket = new NullifyMarket(_init);
        claimMarket = new ClaimMarket(_init, address(nullifyMarket));

        randomizer = new Randomizer(address(s), address(claimMarket), address(nullifyMarket));

        nullifyMarket.setRandomizer(address(randomizer));
        claimMarket.setRandomizer(address(randomizer));
        s.setMarket(address(claimMarket), true);
        s.setMarket(address(nullifyMarket), true);
    }

    function _printAddresses() internal view {
        console.log("--------------------");
        console.log("--------------------");
        console.log("Storage: ", address(s));
        console.log("ClaimMarket: ", address(claimMarket));
        console.log("NullifyMarket: ", address(nullifyMarket));
        console.log("Randomizer: ", address(randomizer));
        console.log("--------------------");
        console.log("--------------------");
    }

    function _labelContracts() internal {
        vm.label({ account: address(s), newLabel: "Storage" });
        vm.label({ account: address(claimMarket), newLabel: "ClaimMarket" });
        vm.label({ account: address(nullifyMarket), newLabel: "NullifyMarket" });
        vm.label({ account: address(randomizer), newLabel: "Randomizer" });
    }
}