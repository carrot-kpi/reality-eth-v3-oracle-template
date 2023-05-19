pragma solidity 0.8.17;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {REALITY_V3_ADDRESS, RealityV3Oracle} from "../src/RealityV3Oracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";
import {ClonesUpgradeable} from "oz-upgradeable/proxy/ClonesUpgradeable.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle intialize test
/// @dev Tests initialization in Reality oracle template.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract InitializeTest is BaseTestSetup {
    function testZeroAddressKpiToken() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressKpiToken()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(0),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(uint256(1))
            })
        );
    }

    function testZeroAddressArbitrator() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressArbitrator()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(address(0), 0, "a", 60, block.timestamp + 60, 0)
            })
        );
    }

    function testEmptyQuestion() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidQuestion()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(address(1), 0, "", 60, block.timestamp + 60, 0)
            })
        );
    }

    function testInvalidTimeout() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidQuestionTimeout()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(address(1), 0, "a", 0, block.timestamp + 60, 0)
            })
        );
    }

    function testInvalidOpeningTimestamp() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidOpeningTimestamp()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(address(1), 0, "a", 60, block.timestamp, 0)
            })
        );
    }

    function testSuccess() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(ClonesUpgradeable.clone(address(realityV3OracleTemplate)));
        Template memory _template = oraclesManager.template(1);
        bytes32 _questionId = bytes32("questionId");
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"),
            abi.encode(_questionId)
        );
        uint256 _openingTs = block.timestamp + 60;
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(address(1), 0, "a", 60, _openingTs, 0)
            })
        );

        assertEq(oracleInstance.template().id, _template.id);

        vm.mockCall(REALITY_V3_ADDRESS, abi.encodeWithSignature("getArbitrator(bytes32)"), abi.encode(address(1)));
        vm.mockCall(REALITY_V3_ADDRESS, abi.encodeWithSignature("getTimeout(bytes32)"), abi.encode(uint32(60)));
        vm.mockCall(REALITY_V3_ADDRESS, abi.encodeWithSignature("getOpeningTS(bytes32)"), abi.encode(_openingTs));
        bytes memory _data = oracleInstance.data();
        (address _onChainReality, bytes32 _onChainQuestionId, string memory _onChainQuestion) =
            abi.decode(_data, (address, bytes32, string));
        assertEq(_onChainReality, REALITY_V3_ADDRESS);
        assertEq(_onChainQuestionId, _questionId);
        assertEq(_onChainQuestion, "a");

        vm.clearMockedCalls();
    }
}
