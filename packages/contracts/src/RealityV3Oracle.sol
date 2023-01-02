pragma solidity 0.8.17;

import {Initializable} from "oz-upgradeable/proxy/utils/Initializable.sol";
import {IOracle} from "carrot/interfaces/oracles/IOracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {IKPIToken} from "carrot/interfaces/kpi-tokens/IKPIToken.sol";
import {IRealityV3} from "./interfaces/external/IRealityV3.sol";
import {IBaseTemplatesManager, Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle
/// @dev An oracle template imlementation leveraging Reality.eth
/// crowdsourced, manual oracle to get data about real-world events
/// on-chain. Since the oracle is crowdsourced, it's extremely flexible,
/// and any condition that can be put into text can leverage Reality.eth
/// as an oracle. The setup is of great importance to ensure the safety
/// of the solution (question timeout, opening timestamp, arbitrator atc must be set
/// with care to avoid unwanted results).
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract RealityV3Oracle is IOracle, Initializable {
    bool public finalized;
    address public kpiToken;
    address internal oraclesManager;
    uint128 internal templateVersion;
    uint256 internal templateId;
    bytes32 internal questionId;
    string internal question;

    error Forbidden();
    error ZeroAddressKpiToken();
    error ZeroAddressReality();
    error ZeroAddressArbitrator();
    error InvalidRealityTemplate();
    error InvalidQuestion();
    error InvalidQuestionTimeout();
    error InvalidOpeningTimestamp();

    event Initialize(address indexed kpiToken, uint256 indexed templateId);
    event Finalize(uint256 result);

    /// @dev Initializes the template through the passed in data. This function is
    /// generally invoked by the oracles manager contract, in turn invoked by a KPI
    /// token template at creation-time. For more info on some of this parameters check
    /// out the Reality.eth docs here: https://reality.eth.limo/app/docs/html/dapp.html#.
    /// @param _params The params are passed in a struct to make it less likely to encounter
    /// stack too deep errors while developing new templates. The params struct contains:
    /// - `_creator`: the address of the entity creating the KPI token.
    /// - `_kpiToken`: the address of the KPI token to which the oracle must be linked to.
    ///   This address is also used to know to which contract to report results back to.
    /// - `_templateId`: the id of the template.
    /// - `_data`: an ABI-encoded structure forwarded by the created KPI token from the KPI token
    ///   creator, containing the initialization parameters for the oracle template.
    ///   In particular the structure is formed in the following way:
    ///     - `address _arbitrator`: The arbitrator for the Reality.eth question.
    ///     - `uint256 _realityTemplateId`: The template id for the Reality.eth question.
    ///     - `string memory _question`: The question that must be submitted to Reality.eth.
    ///     - `uint32 _questionTimeout`: The question timeout as described in the Reality.eth
    ///        docs (linked above).
    ///     - `uint32 _openingTimestamp`: The question opening timestamp as described in the
    ///        Reality.eth docs (linked above).
    ///     - `uint256 minimumBond`: The minimum bond that can be used to answer the question.
    function initialize(InitializeOracleParams memory _params) external payable override initializer {
        if (_params.kpiToken == address(0)) revert ZeroAddressKpiToken();

        (
            address _arbitrator,
            uint256 _realityTemplateId,
            string memory _question,
            uint32 _questionTimeout,
            uint32 _openingTimestamp,
            uint256 _minimumBond
        ) = abi.decode(_params.data, (address, uint256, string, uint32, uint32, uint256));

        if (_arbitrator == address(0)) revert ZeroAddressArbitrator();
        if (_realityTemplateId > 4) revert InvalidRealityTemplate();
        if (bytes(_question).length == 0) revert InvalidQuestion();
        if (_questionTimeout == 0) revert InvalidQuestionTimeout();
        if (_openingTimestamp <= block.timestamp) {
            revert InvalidOpeningTimestamp();
        }

        oraclesManager = msg.sender;
        templateVersion = _params.templateVersion;
        templateId = _params.templateId;
        kpiToken = _params.kpiToken;
        question = _question;
        questionId = IRealityV3(_reality()).askQuestionWithMinBond{value: msg.value}(
            _realityTemplateId, _question, _arbitrator, _questionTimeout, _openingTimestamp, 0, _minimumBond
        );

        emit Initialize(_params.kpiToken, _params.templateId);
    }

    /// @dev Once the question is finalized on Reality.eth, this must be called to
    /// report back the result to the linked KPI token. This also marks the oracle as finalized.
    function finalize() external {
        if (finalized) revert Forbidden();
        finalized = true;
        uint256 _result = uint256(IRealityV3(_reality()).resultForOnceSettled(questionId));
        IKPIToken(kpiToken).finalize(_result);
        emit Finalize(_result);
    }

    /// @dev View function returning all the most important data about the oracle, in
    /// an ABI-encoded structure. The structure pretty much includes all the initialization
    /// data and some.
    /// @return The ABI-encoded data.
    function data() external view override returns (bytes memory) {
        address _realityAddress = _reality(); // gas optimization
        bytes32 _questionId = questionId; // gas optimization
        return abi.encode(
            _realityAddress,
            _questionId,
            IRealityV3(_realityAddress).getArbitrator(_questionId),
            question,
            IRealityV3(_realityAddress).getTimeout(_questionId),
            IRealityV3(_realityAddress).getOpeningTS(_questionId)
        );
    }

    /// @dev View function returning info about the template used to instantiate this oracle.
    /// @return The template struct.
    function template() external view override returns (Template memory) {
        return IBaseTemplatesManager(oraclesManager).template(templateId, templateVersion);
    }

    function _reality() internal pure returns (address) {
        return address(123456789); // will be replaced by codegen-chain-specific-contracts.js
    }
}
