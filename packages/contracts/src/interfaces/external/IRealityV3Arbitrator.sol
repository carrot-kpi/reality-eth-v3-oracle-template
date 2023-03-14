pragma solidity ^0.8.10;

/// SPDX-License-Identifier: GPL-3.0-or-later
/// @title Reality arbitrator interface
/// @dev An interface for a Reality.eth v3 arbitrator, taken from
/// https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IArbitrator.sol.
/// @author Federico Luzzi - <federico.luzzi@protonmail.com>
interface IRealityV3Arbitrator {
    function metadata() external view returns (string memory);

    function realitio() external view returns (address);

    function getDisputeFee() external view returns (uint256);

    function setQuestionFee(uint256 _fee) external;

    function setDisputeFee(uint256 _fee) external;

    function submitAnswerByArbitrator(bytes32 _questionId, bytes32 _answer, address _answerer) external;

    function requestArbitration(bytes32 _questionId, uint256 _maxPrevious) external payable;

    function withdraw(address _address) external;

    function setMetaData(string memory _metadata) external;
}
