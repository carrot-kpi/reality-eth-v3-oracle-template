pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {IRealityV3Arbitrator} from "../src/interfaces/external/IRealityV3Arbitrator.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Set arbitrator question fee
/// @dev Sets the arbitrator question fee on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract SetArbitratorQuestionFee is Script {
    function run(address _arbitrator, uint256 _questionFee) external {
        vm.broadcast();
        IRealityV3Arbitrator(_arbitrator).setQuestionFee(_questionFee);
    }
}
