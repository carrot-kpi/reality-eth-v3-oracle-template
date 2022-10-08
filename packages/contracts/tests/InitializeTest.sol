pragma solidity 0.8.17;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {RealityV3Oracle} from "../src/RealityV3Oracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";
import {Clones} from "oz/proxy/Clones.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle intialize test
/// @dev Tests initialization in Reality oracle template.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract InitializeTest is BaseTestSetup {
    function testZeroAddressKpiToken() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
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

    function testZeroAddressReality() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressReality()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    address(0),
                    address(1),
                    0,
                    "a",
                    60,
                    block.timestamp + 60
                )
            })
        );
    }

    function testZeroAddressArbitrator() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("ZeroAddressArbitrator()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    address(1),
                    address(0),
                    0,
                    "a",
                    60,
                    block.timestamp + 60
                )
            })
        );
    }

    function testEmptyQuestion() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidQuestion()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    address(1),
                    address(1),
                    0,
                    "",
                    60,
                    block.timestamp + 60
                )
            })
        );
    }

    function testInvalidTimeout() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidQuestionTimeout()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    address(1),
                    address(1),
                    0,
                    "a",
                    0,
                    block.timestamp + 60
                )
            })
        );
    }

    function testInvalidOpeningTimestamp() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        vm.expectRevert(abi.encodeWithSignature("InvalidOpeningTimestamp()"));
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    address(1),
                    address(1),
                    0,
                    "a",
                    60,
                    block.timestamp
                )
            })
        );
    }

    function testSuccess() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            Clones.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        address _realityAddress = address(1234);
        bytes32 _questionId = bytes32("questionId");
        vm.mockCall(
            _realityAddress,
            abi.encodeWithSignature(
                "askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"
            ),
            abi.encode(_questionId)
        );
        vm.mockCall(
            address(this),
            abi.encodeWithSignature("template(uint256)"),
            abi.encode(_template)
        );
        uint256 _openingTs = block.timestamp + 60;
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: address(1),
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    _realityAddress,
                    address(1),
                    0,
                    "a",
                    60,
                    _openingTs
                )
            })
        );

        assertEq(oracleInstance.template().id, _template.id);

        vm.mockCall(
            _realityAddress,
            abi.encodeWithSignature("getArbitrator(bytes32)"),
            abi.encode(address(1))
        );
        vm.mockCall(
            _realityAddress,
            abi.encodeWithSignature("getTimeout(bytes32)"),
            abi.encode(uint32(60))
        );
        vm.mockCall(
            _realityAddress,
            abi.encodeWithSignature("getOpeningTS(bytes32)"),
            abi.encode(_openingTs)
        );
        bytes memory _data = oracleInstance.data();
        (
            address _onChainReality,
            bytes32 _onChainQuestionId,
            address _onChainArbitrator,
            string memory _onChainQuestion,
            uint32 _onChainTimeout,
            uint32 _onChainOpeningTs
        ) = abi.decode(
                _data,
                (address, bytes32, address, string, uint32, uint32)
            );
        assertEq(_onChainReality, _realityAddress);
        assertEq(_onChainQuestionId, _questionId);
        assertEq(_onChainArbitrator, address(1));
        assertEq(_onChainQuestion, "a");
        assertEq(_onChainTimeout, 60);
        assertEq(_onChainOpeningTs, _openingTs);

        vm.clearMockedCalls();
    }
}
