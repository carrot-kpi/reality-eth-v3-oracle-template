// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.19;

import {Ownable} from "oz/access/Ownable.sol";
import {IRealityV3Arbitrator} from "./interfaces/external/IRealityV3Arbitrator.sol";
import {IRealityV3} from "./interfaces/external/IRealityV3.sol";

contract TrustedRealityV3Arbitrator is Ownable, IRealityV3Arbitrator {
    address public immutable realitio;

    uint256 internal disputeFee;
    string public metadata;

    error ZeroAddressRealitio();
    error InsufficientFee();
    error TransferFailed();

    event SetDisputeFee(uint256 fee);
    event SetMetadata(string metadata);
    event Withdraw(uint256 withdrawn);

    constructor(address _realitio, string memory _metadata, uint256 _questionFee, uint256 _disputeFee) {
        if (_realitio == address(0)) revert ZeroAddressRealitio();
        realitio = _realitio;
        disputeFee = _disputeFee;
        metadata = _metadata;
        IRealityV3(_realitio).setQuestionFee(_questionFee);
    }

    function getDisputeFee() external view returns (uint256) {
        return disputeFee;
    }

    function setDisputeFee(uint256 _fee) external onlyOwner {
        disputeFee = _fee;
        emit SetDisputeFee(_fee);
    }

    function setQuestionFee(uint256 _fee) external onlyOwner {
        IRealityV3(realitio).setQuestionFee(_fee);
    }

    function setMetaData(string memory _metadata) external onlyOwner {
        metadata = _metadata;
        emit SetMetadata(_metadata);
    }

    function submitAnswerByArbitrator(bytes32 _questionId, bytes32 _answer, address _answerer) external onlyOwner {
        IRealityV3(realitio).submitAnswerByArbitrator(_questionId, _answer, _answerer);
    }

    function cancelArbitration(bytes32 _questionId) external onlyOwner {
        IRealityV3(realitio).cancelArbitration(_questionId);
    }

    function requestArbitration(bytes32 _questionId, uint256 _maxPrevious) external payable {
        if (msg.value < disputeFee) revert InsufficientFee();
        IRealityV3(realitio).notifyOfArbitrationRequest(_questionId, msg.sender, _maxPrevious);
    }

    function withdraw(address _address) external onlyOwner {
        uint256 _withdrawn = address(this).balance;
        (bool _success,) = payable(_address).call{value: _withdrawn}("");
        if (!_success) revert TransferFailed();
        emit Withdraw(_withdrawn);
    }
}
