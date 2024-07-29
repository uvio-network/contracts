// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {IExtension} from "@thirdweb-dev/src/interface/IExtension.sol";

import {IMarket} from "../src/interfaces/IMarket.sol";

import {Randomizer} from "../src/utils/Randomizer.sol";
import {Router} from "../src/utils/Router.sol";

import {Storage} from "../src/Storage.sol";
import {ClaimMarket} from "../src/ClaimMarket.sol";
import {NullifyMarket} from "../src/NullifyMarket.sol";
import {BaseMarket} from "../src/BaseMarket.sol";

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract Deploy is Script {

    address public depoyer;

    Randomizer public randomizer;
    Router public router;

    Storage public s;
    ClaimMarket public claimMarket;
    NullifyMarket public nullifyMarket;

    address public asset = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH

    uint256 public constant MAX_CLAIMS = 4;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant MIN_CLAIM_DURATION = 1 weeks;
    uint256 public constant VOTERS_LIMIT = 5;
    uint256 public constant VOTING_DURATION = 3 days;
    uint256 public constant DISPUTE_DURATION = 3 days;
    uint256 public constant FEE = 1_000; // 10%

    function run() public {

        uint256 _pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        VmSafe.Wallet memory _wallet = vm.createWallet(_pk);
        depoyer = _wallet.addr;

        vm.startBroadcast(_pk);

        _deployContracts(depoyer);
        _initalizeRouter();

        vm.stopBroadcast();

        _printAddresses();
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
            MIN_CLAIM_DURATION,
            VOTERS_LIMIT,
            VOTING_DURATION,
            DISPUTE_DURATION,
            FEE,
            address(s),
            _deployer, // owner
            address(0) // randomizer
        );
        nullifyMarket = new NullifyMarket(_init);
        claimMarket = new ClaimMarket(_init, address(nullifyMarket));

        randomizer = new Randomizer(address(s), address(claimMarket), address(nullifyMarket));
        router = new Router(
            _deployer, // owner
            asset // weth
        );

        nullifyMarket.setRandomizer(address(randomizer));
        claimMarket.setRandomizer(address(randomizer));
    }

    function _initalizeRouter() internal {
        IExtension.Extension memory _extension;

        // Storage
        IExtension.ExtensionFunction[] memory _functions = new IExtension.ExtensionFunction[](2);
        _functions[0] = IExtension.ExtensionFunction(
            Storage.deposit.selector,
            "deposit(uint256,address)"
        );
        _functions[1] = IExtension.ExtensionFunction(
            Storage.withdraw.selector,
            "withdraw(uint256,address)"
        );

        _extension = IExtension.Extension(
            IExtension.ExtensionMetadata(
                "Storage",
                "",
                address(s)
            ),
            _functions
        );
        router.addExtension(_extension);

        // ClaimMarket
        _functions = new IExtension.ExtensionFunction[](5);
        _functions[0] = IExtension.ExtensionFunction(
            BaseMarket.propose.selector,
            "propose((string,uint256,uint256,uint256,uint256,uint256,uint256,bool))"
        );
        _functions[1] = IExtension.ExtensionFunction(
            BaseMarket.stake.selector,
            "stake(uint256,uint256,bool)"
        );
        _functions[2] = IExtension.ExtensionFunction(
            BaseMarket.vote.selector,
            "vote(uint256,bool,bool)"
        );
        _functions[3] = IExtension.ExtensionFunction(
            BaseMarket.claimProceeds.selector,
            "claimProceeds(uint256,uint256,address)"
        );
        _functions[4] = IExtension.ExtensionFunction(
            BaseMarket.claimProceedsMulti.selector,
            "claimProceedsMulti(uint256[],uint256,address)"
        );

        _extension = IExtension.Extension(
            IExtension.ExtensionMetadata(
                "ClaimMarket",
                "",
                address(claimMarket)
            ),
            _functions
        );
        router.addExtension(_extension);
    }

    function _printAddresses() internal view {
        console.log("--------------------");
        console.log("--------------------");
        console.log("Storage: ", address(s));
        console.log("ClaimMarket: ", address(claimMarket));
        console.log("NullifyMarket: ", address(nullifyMarket));
        console.log("Randomizer: ", address(randomizer));
        console.log("Router: ", address(router));
        console.log("--------------------");
        console.log("--------------------");
    }

    function _labelContracts() internal {
        vm.label({ account: address(s), newLabel: "Storage" });
        vm.label({ account: address(claimMarket), newLabel: "ClaimMarket" });
        vm.label({ account: address(nullifyMarket), newLabel: "NullifyMarket" });
        vm.label({ account: address(randomizer), newLabel: "Randomizer" });
        vm.label({ account: address(router), newLabel: "Router" });
    }
}