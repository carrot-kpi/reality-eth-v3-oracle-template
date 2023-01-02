pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Strings} from "oz/utils/Strings.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Deploy
/// @dev Deploys the template on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract Deploy is Script {
    error ZeroAddressFeeReceiver();
    error ZeroAddressGelatoOps();

    function run() external {
        bytes memory _bytecode =
            vm.getCode(string.concat("RealityV3Oracle", Strings.toString(block.chainid), ".sol:RealityV3Oracle"));

        address _deployed;
        vm.broadcast();
        assembly {
            _deployed := create(0, add(_bytecode, 0x20), mload(_bytecode))
        }

        console2.log("Template deployed at address", _deployed);
    }
}
