pragma solidity 0.8.19;

import {Initializable} from "oz-upgradeable/proxy/utils/Initializable.sol";
import {IOracle} from "carrot/interfaces/oracles/IOracle.sol";
import {IOraclesManager1} from "carrot/interfaces/oracles-managers/IOraclesManager1.sol";
import {IKPIToken} from "carrot/interfaces/kpi-tokens/IKPIToken.sol";
import {IRealityV3} from "./interfaces/external/IRealityV3.sol";
import {IBaseTemplatesManager, Template} from "carrot/interfaces/IBaseTemplatesManager.sol";
import {BaseOracle} from "carrot/presets/oracles/BaseOracle.sol";
import {ConstrainedOracle, Constraint} from "carrot/presets/oracles/ConstrainedOracle.sol";
import {InitializeOracleParams} from "carrot/commons/Types.sol";

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality oracle
/// @dev An oracle template implementation leveraging Reality.eth's
/// crowdsourced, manual oracle to get data about real-world events
/// on-chain. Since the oracle is crowdsourced, it's extremely flexible,
/// and any condition that can be put into text can use Reality.eth
/// as an oracle. The setup is of great importance to ensure the safety
/// of the solution (question timeout, opening timestamp, arbitrator atc must be set
/// with care to avoid unwanted results).
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
contract RealityV3Oracle is BaseOracle, ConstrainedOracle {
    address public immutable reality;
    uint256 public immutable minimumQuestionTimeout;
    uint256 public immutable minimumAnswerWindows;

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

    /// @dev Sets some of the parameters of the oracle template.
    /// @param _reality The address of the reference Reality.eth contract.
    /// @param _minimumQuestionTimeout The minimum question timeout allowed to create
    /// a question using this template.
    /// @param _minimumAnswerWindows A number indicating the minimum amount of answer
    /// windows that must pass between the question opening timestamp and the KPI token
    /// expiration. This is used to avoid malicious questions that open for answers right
    /// before the KPI token expires, not leaving the crowdsourced answer process the
    /// time to play out organically. As an example, if this value is set to 3 and a
    /// question is asked that opens at time x with a question timeout of 1 minute,
    /// the expiration timestamp of the attached KPI token will have to be set to at
    /// least x + 3 minutes in order for the creation process to go through.
    constructor(address _reality, uint256 _minimumQuestionTimeout, uint256 _minimumAnswerWindows) {
        reality = _reality;
        minimumQuestionTimeout = _minimumQuestionTimeout;
        minimumAnswerWindows = _minimumAnswerWindows;
    }

    /// @dev Initializes the template through the passed in data. This function is
    /// generally invoked by the oracles manager contract, in turn invoked by a KPI
    /// token template at creation-time. For more info on some of this parameters check
    /// out the Reality.eth docs here: https://reality.eth.limo/app/docs/html/dapp.html#.
    /// @param _params The params are passed in a struct and are:
    /// - `creator`: the address of the entity creating the KPI token.
    /// - `kpiToken`: the address of the KPI token to which the oracle must be linked to.
    ///   This address is also used to know to which contract to report results back to.
    /// - `templateId`: the id of the template.
    /// - `data`: an ABI-encoded structure forwarded by the created KPI token from the KPI token
    ///   creator, containing the initialization parameters for the oracle template.
    ///   In particular the structure is formed in the following way:
    ///     - `address arbitrator`: The arbitrator for the Reality.eth question.
    ///     - `uint256 realityTemplateId`: The template id for the Reality.eth question.
    ///     - `string memory question`: The question that must be submitted to Reality.eth.
    ///     - `uint32 questionTimeout`: The question timeout as described in the Reality.eth
    ///        docs (linked above).
    ///     - `uint32 openingTimestamp`: The question opening timestamp as described in the
    ///        Reality.eth docs (linked above).
    ///     - `uint256 minimumBond`: The minimum bond that can be used to answer the question.
    function initialize(InitializeOracleParams memory _params) external payable override initializer {
        __BaseOracle_init(_params.kpiToken, _params.templateId, _params.templateVersion);

        (
            address _arbitrator,
            uint256 _realityTemplateId,
            string memory _question,
            uint32 _questionTimeout,
            uint32 _openingTimestamp,
            uint256 _minimumBond,
            Constraint _constraint,
            uint256 _value0,
            uint256 _value1
        ) = abi.decode(_params.data, (address, uint256, string, uint32, uint32, uint256, Constraint, uint256, uint256));

        __ConstrainedOracle_init(_constraint, _value0, _value1);

        if (_arbitrator == address(0)) revert ZeroAddressArbitrator();
        // we only support bool, uint, single select and datetime templates for now
        if (_realityTemplateId == 3 || _realityTemplateId > 4) revert InvalidRealityTemplate();
        if (bytes(_question).length == 0) revert InvalidQuestion();
        if (_questionTimeout < minimumQuestionTimeout) {
            revert InvalidQuestionTimeout();
        }
        if (
            _openingTimestamp <= block.timestamp
                || _questionTimeout * minimumAnswerWindows + _openingTimestamp >= IKPIToken(_params.kpiToken).expiration()
        ) {
            revert InvalidOpeningTimestamp();
        }

        question = _question;
        questionId = IRealityV3(reality).askQuestionWithMinBond{value: msg.value}(
            _realityTemplateId, _question, _arbitrator, _questionTimeout, _openingTimestamp, 0, _minimumBond
        );

        emit Initialize(_params.kpiToken, _params.templateId);
    }

    /// @dev Once the question is finalized on Reality.eth, this must be called to
    /// report back the result to the linked KPI token. This also marks the oracle as finalized.
    function finalize() external {
        if (finalized) revert Forbidden();
        finalized = true;
        uint256 _result = uint256(IRealityV3(reality).resultForOnceSettled(questionId));
        IKPIToken(kpiToken).finalize(_toCompletionPercentage(_result));
    }

    /// @dev View function returning all the most important data about the oracle, in
    /// an ABI-encoded structure. The structure pretty much includes all the initialization
    /// data and some.
    /// @return The ABI-encoded data.
    function data() external view override returns (bytes memory) {
        return abi.encode(constraint, value0, value1, reality, questionId, question);
    }
}
