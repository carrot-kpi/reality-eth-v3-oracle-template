pragma solidity 0.8.19;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Strings} from "oz/utils/Strings.sol";
import {TrustedRealityV3Arbitrator} from "../src/TrustedRealityV3Arbitrator.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Deploy arbitrator
/// @dev Deploys the arbitrator contract on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract DeployArbitrator is Script {
    error ZeroAddressReality();

    function run(address _reality, string calldata _metadata, uint256 _questionFee, uint256 _disputeFee) external {
        if (_reality == address(0)) revert ZeroAddressReality();

        vm.startBroadcast();

        console2.log(
            "Arbitrator deployed at address",
            address(
                new TrustedRealityV3Arbitrator(
                    _reality,
                    _metadata,
                    _questionFee,
                    _disputeFee
                )
            )
        );

        vm.stopBroadcast();
    }
}
