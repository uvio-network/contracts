// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IMarkets} from "../src/interfaces/IMarkets.sol";

import {Randomizer} from "../src/utils/Randomizer.sol";
import {PriceProvider} from "../src/utils/PriceProvider.sol";

import {Markets} from "../src/Markets.sol";

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract Deploy is Script {

    address public deployer;

    Randomizer public randomizer;
    PriceProvider public priceProvider;

    Markets public m;

    address public asset = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH

    uint256 public constant MAX_CLAIMS = 4;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant MIN_STAKE_INCREASE = 10_000;
    uint40 public constant MIN_CLAIM_DURATION = 1 weeks;
    uint256 public constant VOTERS_LIMIT = 5;
    uint40 public constant VOTING_DURATION = 3 days;
    uint40 public constant DISPUTE_DURATION = 3 days;
    uint256 public constant FEE = 1_000; // 10%
    uint256 public constant HALVES = 10;

    function run() public {

        uint256 _pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        VmSafe.Wallet memory _wallet = vm.createWallet(_pk);
        deployer = _wallet.addr;

        vm.startBroadcast(_pk);

        _deployContracts(deployer);

        vm.stopBroadcast();

        _printAddresses();
        _labelContracts();
    }

    function _deployContracts(address _deployer) internal {

        priceProvider = new PriceProvider();

        IMarkets.Initialize memory _init = IMarkets.Initialize(
            MIN_STAKE,
            MIN_STAKE_INCREASE,
            FEE,
            MIN_CLAIM_DURATION,
            VOTING_DURATION,
            DISPUTE_DURATION,
            _deployer, // owner
            asset,
            address(0), // randomizer
            address(priceProvider)
        );
        m = new Markets(_init);

        randomizer = new Randomizer(deployer, address(m));

        randomizer.setKeeper(deployer, true);
        m.setRandomizer(address(randomizer));
    }

    function _printAddresses() internal view {
        console.log("--------------------");
        console.log("--------------------");
        console.log("Markets: ", address(m));
        console.log("Randomizer: ", address(randomizer));
        console.log("PriceProvider: ", address(priceProvider));
        console.log("--------------------");
        console.log("--------------------");
    }

    function _labelContracts() internal {
        vm.label({ account: address(m), newLabel: "Markets" });
        vm.label({ account: address(randomizer), newLabel: "Randomizer" });
        vm.label({ account: address(priceProvider), newLabel: "PriceProvider" });
    }
}