pragma solidity >=0.8.0;

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality.eth v3 interface
/// @dev Interface for the Reality.eth v3 contract.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
interface IRealityV3 {
    function askQuestionWithMinBond(
        uint256 _templateId,
        string memory _question,
        address _arbitrator,
        uint32 _timeout,
        uint32 _openingTs,
        uint256 _nonce,
        uint256 _minimumBond
    ) external payable returns (bytes32);

    function getArbitrator(bytes32 _id) external view returns (address);

    function getOpeningTS(bytes32 _id) external view returns (uint32);

    function getTimeout(bytes32 _id) external view returns (uint32);

    function resultForOnceSettled(bytes32 _id) external view returns (bytes32);

    function setQuestionFee(uint256 fee) external;

    function submitAnswerByArbitrator(bytes32 _questionId, bytes32 _answer, address _answerer) external;

    function cancelArbitration(bytes32 _questionId) external;

    function notifyOfArbitrationRequest(bytes32 _questionId, address _requester, uint256 _maxPrevious) external;
}
