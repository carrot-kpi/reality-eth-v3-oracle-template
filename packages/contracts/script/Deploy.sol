pragma solidity 0.8.19;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Strings} from "oz/utils/Strings.sol";
import {RealityV3Oracle} from "../src/RealityV3Oracle.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Deploy
/// @dev Deploys the template on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract Deploy is Script {
    error ZeroAddressReality();
    error ZeroMinimumQuestionTimeout();
    error ZeroMinimumAnswerWindows();

    function run(address _reality, uint256 _minimumQuestionTimeout, uint256 _minimumAnswerWindows) external {
        if (_reality == address(0)) revert ZeroAddressReality();
        if (_minimumQuestionTimeout == 0) revert ZeroMinimumQuestionTimeout();
        if (_minimumAnswerWindows == 0) revert ZeroMinimumAnswerWindows();

        vm.startBroadcast();

        console2.log(
            "Template deployed at address",
            address(
                new RealityV3Oracle(
                    _reality,
                    _minimumQuestionTimeout,
                    _minimumAnswerWindows
                )
            )
        );
        
        vm.stopBroadcast();
    }
}
