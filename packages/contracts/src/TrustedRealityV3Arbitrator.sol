// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.19;

import {Ownable} from "oz/access/Ownable.sol";
import {IRealityV3Arbitrator} from "./interfaces/external/IRealityV3Arbitrator.sol";
import {IRealityV3} from "./interfaces/external/IRealityV3.sol";

contract TrustedRealityV3Arbitrator is Ownable, IRealityV3Arbitrator {
    address public immutable reality;

    uint256 internal disputeFee;
    string public metadata;

    error ZeroAddressReality();
    error InsufficientFee();
    error TransferFailed();

    event SetDisputeFee(uint256 fee);
    event SetMetadata(string metadata);
    event Withdraw(uint256 withdrawn);

    constructor(address _reality, string memory _metadata, uint256 _questionFee, uint256 _disputeFee) {
        if (_reality == address(0)) revert ZeroAddressReality();
        reality = _reality;
        disputeFee = _disputeFee;
        metadata = _metadata;
        IRealityV3(_reality).setQuestionFee(_questionFee);
    }

    function getDisputeFee() external view returns (uint256) {
        return disputeFee;
    }

    function setDisputeFee(uint256 _fee) external onlyOwner {
        disputeFee = _fee;
        emit SetDisputeFee(_fee);
    }

    function setQuestionFee(uint256 _fee) external onlyOwner {
        IRealityV3(reality).setQuestionFee(_fee);
    }

    function setMetaData(string memory _metadata) external onlyOwner {
        metadata = _metadata;
        emit SetMetadata(_metadata);
    }

    function submitAnswerByArbitrator(bytes32 _questionId, bytes32 _answer, address _answerer) external onlyOwner {
        IRealityV3(reality).submitAnswerByArbitrator(_questionId, _answer, _answerer);
    }

    function cancelArbitration(bytes32 _questionId) external onlyOwner {
        IRealityV3(reality).cancelArbitration(_questionId);
    }

    function requestArbitration(bytes32 _questionId, uint256 _maxPrevious) external payable {
        if (msg.value < disputeFee) revert InsufficientFee();
        IRealityV3(reality).notifyOfArbitrationRequest(_questionId, msg.sender, _maxPrevious);
    }

    function withdraw(address _address) external onlyOwner {
        uint256 _withdrawn = address(this).balance;
        (bool _success,) = payable(_address).call{value: _withdrawn}("");
        if (!_success) revert TransferFailed();
        emit Withdraw(_withdrawn);
    }

    function realitio() external view returns (address) {
        return reality;
    }
}
