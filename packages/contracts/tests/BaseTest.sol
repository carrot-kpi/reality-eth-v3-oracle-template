pragma solidity 0.8.17;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {console2} from "forge-std/console2.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Base oracle template test
/// @dev Base oracle template test.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract BaseTest is BaseTestSetup {
    function testBase() external {
        console2.log("Logging example");
        // ...
    }
}
