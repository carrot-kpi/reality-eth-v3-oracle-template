pragma solidity 0.8.19;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {RealityV3Oracle} from "../src/RealityV3Oracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";
import {ClonesUpgradeable} from "oz-upgradeable/proxy/ClonesUpgradeable.sol";
import {MockKPIToken, OracleData} from "./mocks/MockKPIToken.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle finalize test
/// @dev Tests finalization in Reality oracle template.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract FinalizeTest is BaseTestSetup {
    function testRealityQuestionNotFinalized() external {
        RealityV3Oracle oracleInstance = RealityV3Oracle(
            ClonesUpgradeable.clone(address(realityV3OracleTemplate))
        );
        Template memory _template = oraclesManager.template(1);
        bytes32 _questionId = bytes32("questionId");
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature(
                "askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"
            ),
            abi.encode(_questionId)
        );
        address kpiToken = address(1);
        vm.mockCall(
            kpiToken,
            abi.encodeWithSignature("expiration()"),
            abi.encode(2 ** 128)
        );
        vm.prank(address(oraclesManager));
        oracleInstance.initialize(
            InitializeOracleParams({
                creator: address(this),
                kpiToken: kpiToken,
                templateId: _template.id,
                templateVersion: _template.version,
                data: abi.encode(
                    REALITY_V3_ADDRESS,
                    0,
                    "a",
                    60,
                    block.timestamp + 60,
                    0
                )
            })
        );

        vm.mockCallRevert(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode("")
        );

        vm.expectRevert();
        oracleInstance.finalize();

        vm.clearMockedCalls();
    }

    function testSuccess() external {
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature(
                "askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"
            ),
            abi.encode(bytes32("question id"))
        );
        bytes memory realityV3OracleInitializationData = abi.encode(
            REALITY_V3_ADDRESS,
            1,
            "Test?",
            60,
            block.timestamp + 60,
            0
        );
        OracleData[] memory _oracleDatas = new OracleData[](1);
        _oracleDatas[0] = OracleData({
            templateId: 1,
            data: realityV3OracleInitializationData
        });
        bytes memory _oraclesInitializationData = abi.encode(_oracleDatas);

        string memory _description = "test";
        address _predictedKpiTokenAddress = kpiTokensManager
            .predictInstanceAddress(
                address(this),
                1,
                _description,
                block.timestamp + 60,
                abi.encode(""),
                _oraclesInitializationData
            );

        factory.createToken(
            1,
            _description,
            block.timestamp + 60,
            abi.encode(""),
            _oraclesInitializationData
        );

        MockKPIToken _kpiToken = MockKPIToken(_predictedKpiTokenAddress);

        RealityV3Oracle _oracleInstance = RealityV3Oracle(
            _kpiToken.oracles()[0]
        );

        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32("1234"))
        );
        vm.mockCall(
            address(_kpiToken),
            abi.encodeWithSignature(
                "finalize(uint256)",
                uint256(bytes32("1234"))
            ),
            abi.encode()
        );

        _oracleInstance.finalize();

        assertTrue(_oracleInstance.finalized());
    }
}
