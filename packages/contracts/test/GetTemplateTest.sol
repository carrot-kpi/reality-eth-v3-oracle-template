pragma solidity 0.8.19;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {RealityV3Oracle} from "../src/RealityV3Oracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";
import {ClonesUpgradeable} from "oz-upgradeable/proxy/ClonesUpgradeable.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle get template test
/// @dev Tests template query in Reality oracle template.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract GetTemplateTest is BaseTestSetup {
    function testSuccess() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        bytes32 _questionId = bytes32("questionId");
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"),
            abi.encode(_questionId)
        );
        address kpiToken = address(1);
        vm.mockCall(kpiToken, abi.encodeWithSignature("expiration()"), abi.encode(2 ** 128));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: kpiToken,
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(REALITY_V3_ADDRESS, 0, "a", 60, block.timestamp + 60, 0)
            })
        );

        assertEq(oracleInstance.template().id, _template.id);

        vm.clearMockedCalls();
    }
}
