pragma solidity 0.8.17;

import {Test} from "forge-std/Test.sol";
import {OracleTemplate} from "../../src/OracleTemplate.sol";
import {console2} from "forge-std/console2.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Base test setup
/// @dev Test hook to set up a base test environment for each test.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
abstract contract BaseTestSetup is Test {
    OracleTemplate internal oracleTemplate;

    function setUp() public {
        console2.log("Setting up");
        oracleTemplate = new OracleTemplate();
    }
}
