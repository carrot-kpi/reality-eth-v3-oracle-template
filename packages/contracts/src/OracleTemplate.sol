pragma solidity 0.8.17;

import {IOracleTemplate} from "./interfaces/IOracleTemplate.sol";
import {Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Oracle template implementation
/// @dev An oracle template implementation
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract OracleTemplate is IOracleTemplate {
    function initialize(InitializeOracleParams memory _params)
        external
        payable
        override
    {}

    function kpiToken() external view override returns (address) {
        return address(0);
    }

    function template() external view override returns (Template memory) {
        return
            Template({
                id: 1,
                addrezz: address(0),
                version: 1,
                specification: "foo"
            });
    }

    function finalized() external view override returns (bool) {
        return true;
    }

    function data() external view override returns (bytes memory) {
        return abi.encode();
    }
}
