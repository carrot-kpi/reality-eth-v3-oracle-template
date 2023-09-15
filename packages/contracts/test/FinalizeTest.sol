pragma solidity 0.8.19;

import {BaseTestSetup} from "./commons/BaseTestSetup.sol";
import {RealityV3Oracle} from "../src/RealityV3Oracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";
import {ClonesUpgradeable} from "oz-upgradeable/proxy/ClonesUpgradeable.sol";
import {MockKPIToken, OracleData} from "./mocks/MockKPIToken.sol";
import {Constraint} from "carrot/presets/oracles/ConstrainedOracle.sol";
import {UNIT} from "carrot/commons/Constants.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle finalize test
/// @dev Tests finalization in Reality oracle template.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract FinalizeTest is BaseTestSetup {
    function initializeKPITokenOracle(
        address _arbitrator,
        uint256 _realityTemplateId,
        string memory _question,
        uint256 _questionTimeout,
        uint256 _openingTimestamp,
        uint256 _minimumBond,
        Constraint _constraint,
        uint256 _value0,
        uint256 _value1
    ) internal returns (MockKPIToken, RealityV3Oracle) {
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"),
            abi.encode(bytes32("question id"))
        );
        bytes memory realityV3OracleInitializationData = abi.encode(
            _arbitrator,
            _realityTemplateId,
            _question,
            _questionTimeout,
            _openingTimestamp,
            _minimumBond,
            _constraint,
            _value0,
            _value1
        );
        OracleData[] memory _oracleDatas = new OracleData[](1);
        _oracleDatas[0] = OracleData({templateId: 1, data: realityV3OracleInitializationData});
        bytes memory _oraclesInitializationData = abi.encode(_oracleDatas);

        string memory _description = "test";
        address _predictedKpiTokenAddress = kpiTokensManager.predictInstanceAddress(
            address(this), 1, _description, block.timestamp + 60, abi.encode(""), _oraclesInitializationData
        );

        factory.createToken(1, _description, block.timestamp + 60, abi.encode(""), _oraclesInitializationData);

        MockKPIToken _kpiToken = MockKPIToken(_predictedKpiTokenAddress);

        return (_kpiToken, RealityV3Oracle(_kpiToken.oracles()[0]));
    }

    function testRealityQuestionNotFinalized() external {
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
                data: abi.encode(REALITY_V3_ADDRESS, 0, "a", 60, block.timestamp + 60, 0, Constraint.Equal, 10, 0)
            })
        );

        vm.mockCallRevert(REALITY_V3_ADDRESS, abi.encodeWithSignature("resultForOnceSettled(bytes32)"), abi.encode(""));

        vm.expectRevert();
        oracleInstance.finalize();

        vm.clearMockedCalls();
    }

    function testSuccessEqualConstraintWrongFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Equal, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(11)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessEqualConstraintExactFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Equal, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessNotEqualConstraintWrongFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.NotEqual, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessNotEqualConstraintExactFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.NotEqual, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(11)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessGreaterThanConstraintWrongFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.GreaterThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(9)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessGreaterThanConstraintTargetFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.GreaterThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessGreaterThanConstraintCorrectFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.GreaterThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(11)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessLowerThanConstraintWrongFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.LowerThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(11)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessLowerThanConstraintTargetFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.LowerThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessLowerThanConstraintCorrectFinalValue() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.LowerThan, 10, 0
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(9)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessBetweenConstraintFinalValueBelowLowerBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Between, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(9)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessBetweenConstraintFinalValueAtLowerBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Between, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessBetweenConstraintFinalValueAboveUpperBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Between, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(22)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessBetweenConstraintFinalValueAtUpperBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Between, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(20)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessBetweenConstraintFinalValueInRange() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Between, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(12)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueBelowLowerBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(9)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueAtLowerBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(10)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (0)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueAboveUpperBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(22)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueAtUpperBound() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(20)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (UNIT)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueInRange1() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(12)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (200_000)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueInRange2() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(15)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (500_000)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccessRangeConstraintFinalValueInRange3() external {
        (MockKPIToken _kpiToken, RealityV3Oracle _oracle) = initializeKPITokenOracle(
            REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Range, 10, 20
        );
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("resultForOnceSettled(bytes32)"),
            abi.encode(bytes32(uint256(18)))
        );
        vm.expectCall(address(_kpiToken), abi.encodeCall(_kpiToken.finalize, (800_000)));
        _oracle.finalize();
        assertTrue(_oracle.finalized());
    }

    function testSuccess() external {
        vm.mockCall(
            REALITY_V3_ADDRESS,
            abi.encodeWithSignature("askQuestionWithMinBond(uint256,string,address,uint32,uint32,uint256,uint256)"),
            abi.encode(bytes32("question id"))
        );
        bytes memory realityV3OracleInitializationData =
            abi.encode(REALITY_V3_ADDRESS, 1, "Test?", 60, block.timestamp + 60, 0, Constraint.Equal, 10, 0);
        OracleData[] memory _oracleDatas = new OracleData[](1);
        _oracleDatas[0] = OracleData({templateId: 1, data: realityV3OracleInitializationData});
        bytes memory _oraclesInitializationData = abi.encode(_oracleDatas);

        string memory _description = "test";
        address _predictedKpiTokenAddress = kpiTokensManager.predictInstanceAddress(
            address(this), 1, _description, block.timestamp + 60, abi.encode(""), _oraclesInitializationData
        );

        factory.createToken(1, _description, block.timestamp + 60, abi.encode(""), _oraclesInitializationData);

        MockKPIToken _kpiToken = MockKPIToken(_predictedKpiTokenAddress);

        RealityV3Oracle _oracleInstance = RealityV3Oracle(_kpiToken.oracles()[0]);

        vm.mockCall(
            REALITY_V3_ADDRESS, abi.encodeWithSignature("resultForOnceSettled(bytes32)"), abi.encode(bytes32("1234"))
        );
        vm.mockCall(
            address(_kpiToken), abi.encodeWithSignature("finalize(uint256)", uint256(bytes32("1234"))), abi.encode()
        );

        _oracleInstance.finalize();

        assertTrue(_oracleInstance.finalized());
    }
}
