pragma solidity 0.8.17;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Strings} from "oz/utils/Strings.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Deploy arbitrator
/// @dev Deploys the arbitrator contract on a target network.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract DeployArbitrator is Script {
    function run(string calldata _metadata, uint256 _questionFee) external {
        bytes memory _bytecodeWithoutConstructorParams = vm.getCode(
            string.concat(
                "TrustedRealityV3Arbitrator", Strings.toString(block.chainid), ".sol:TrustedRealityV3Arbitrator"
            )
        );

        bytes memory _bytecode =
            abi.encodePacked(_bytecodeWithoutConstructorParams, abi.encode(_metadata, _questionFee));

        address _deployed;
        vm.broadcast();
        assembly {
            _deployed := create(0, add(_bytecode, 0x20), mload(_bytecode))
        }

        console2.log("Arbitrator deployed at address", _deployed);
    }
}
