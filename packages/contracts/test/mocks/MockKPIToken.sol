pragma solidity 0.8.19;

import {IKPIToken} from "carrot/interfaces/kpi-tokens/IKPIToken.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeKPITokenParams} from "carrot/commons/Types.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";

struct OracleData {
    uint256 templateId;
    bytes data;
}

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title KPI token template implementation
/// @dev A KPI token template implementation
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract MockKPIToken is IKPIToken {
    address[] internal _oracles;

    function initialize(InitializeKPITokenParams memory _params) external payable override {
        OracleData[] memory _oracleData = abi.decode(_params.oraclesData, (OracleData[]));
        for (uint8 _i = 0; _i < _oracleData.length; _i++) {
            _oracles.push(
                IOraclesManager1(_params.oraclesManager).instantiate(
                    _params.creator, _oracleData[_i].templateId, _oracleData[_i].data
                )
            );
        }
    }

    function finalize(uint256 _result) external override {}

    function redeem(bytes memory _data) external override {}

    function owner() external pure override returns (address) {
        return address(0);
    }

    function transferOwnership(address _newOwner) external override {}

    function template() external pure override returns (Template memory) {
        return Template({id: 1, addrezz: address(0), version: 1, specification: "foo"});
    }

    function description() external pure override returns (string memory) {
        return "foo";
    }

    function finalized() external pure override returns (bool) {
        return true;
    }

    function expiration() external view override returns (uint256) {
        return block.timestamp + 2 ** 128;
    }

    function creationTimestamp() external view override returns (uint256) {
        return block.timestamp;
    }

    function data() external pure override returns (bytes memory) {
        return abi.encode();
    }

    function oracles() external view override returns (address[] memory) {
        return _oracles;
    }
}
