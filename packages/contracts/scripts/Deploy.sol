pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {OracleTemplate} from "../src/OracleTemplate.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Deploy
/// @dev Deploys the template on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract Deploy is Script {
    function run() external {
        vm.broadcast();
        OracleTemplate _oracleTemplate = new OracleTemplate();
        console2.log("Template deployed at address", address(_oracleTemplate));
    }
}
