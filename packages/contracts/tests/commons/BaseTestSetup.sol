pragma solidity 0.8.17;

import {Test} from "forge-std/Test.sol";
import {ERC20PresetMinterPauser} from "oz/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import {KPITokensManager1} from "carrot/kpi-tokens-managers/KPITokensManager1.sol";
import {RealityV3Oracle} from "../../src/RealityV3Oracle.sol";
import {OraclesManager1} from "carrot/oracles-managers/OraclesManager1.sol";
import {KPITokensFactory} from "carrot/KPITokensFactory.sol";
import {MockKPIToken} from "../mocks/MockKPIToken.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Base test setup
/// @dev Test hook to set up a base test environment for each test.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
abstract contract BaseTestSetup is Test {
    string internal constant REALITY_ETH_SPECIFICATION = "QmRvoExBSESXedwqfC1cs4DGaRymnRR1wA9YGoZbqsE8Mf";

    ERC20PresetMinterPauser internal firstErc20;
    ERC20PresetMinterPauser internal secondErc20;
    address internal feeReceiver;
    KPITokensFactory internal factory;
    MockKPIToken internal mockKPITokenTemplate;
    KPITokensManager1 internal kpiTokensManager;
    RealityV3Oracle internal realityV3OracleTemplate;
    OraclesManager1 internal oraclesManager;

    function setUp() external {
        firstErc20 = new ERC20PresetMinterPauser("Token 1", "TKN1");
        secondErc20 = new ERC20PresetMinterPauser("Token 2", "TKN2");

        feeReceiver = address(400);
        factory = new KPITokensFactory(address(1), address(1), feeReceiver);

        mockKPITokenTemplate = new MockKPIToken();
        kpiTokensManager = new KPITokensManager1(address(factory));
        kpiTokensManager.addTemplate(address(mockKPITokenTemplate), "test-specification");

        realityV3OracleTemplate = new RealityV3Oracle();
        oraclesManager = new OraclesManager1(address(factory));
        oraclesManager.addTemplate(address(realityV3OracleTemplate), REALITY_ETH_SPECIFICATION);

        factory.setKpiTokensManager(address(kpiTokensManager));
        factory.setOraclesManager(address(oraclesManager));
    }
}
