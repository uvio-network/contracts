// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {BaseRouter} from "@thirdweb-dev/src/presets/BaseRouter.sol";

contract Router is BaseRouter {
    
    address public admin;

    IWETH public immutable weth;

    constructor(address _admin, address _weth) BaseRouter(new Extension[](0)) {
        admin = _admin;
        weth = IWETH(_weth);
    }

    function setAdmin(address _admin) external {
        require(msg.sender == admin, "RouterUpgradeable: Only admin can set a new admin");
        admin = _admin;
    }

    function _isAuthorizedCallToUpgrade() internal view virtual override returns (bool) {
        return msg.sender == admin;
    }

    fallback() external payable override {
        if(msg.data.length == 0) return;
        
        address implementation = getImplementationForFunction(msg.sig);
        require(implementation != address(0), "Router: function does not exist.");
        _delegate(implementation);
    }
}