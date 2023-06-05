// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.19;

import {Ownable} from "oz/access/Ownable.sol";
import {IRealityV3Arbitrator} from "./interfaces/external/IRealityV3Arbitrator.sol";
import {IRealityV3} from "./interfaces/external/IRealityV3.sol";

address constant REALITY_V3_ADDRESS = address(123456789); // will be replaced by codegen-chain-specific-contracts.js

contract TrustedRealityV3Arbitrator is Ownable, IRealityV3Arbitrator {
    address public constant realitio = REALITY_V3_ADDRESS;
    uint256 internal disputeFee;
    string public metadata;

    error InsufficientFee();
    error TransferFailed();

    event SetDisputeFee(uint256 fee);
    event SetMetadata(string metadata);
    event Withdraw(uint256 withdrawn);

    constructor(string memory _metadata, uint256 _questionFee) {
        metadata = _metadata;
        IRealityV3(REALITY_V3_ADDRESS).setQuestionFee(_questionFee);
    }

    function getDisputeFee() external view returns (uint256) {
        return disputeFee;
    }

    function setDisputeFee(uint256 _fee) external onlyOwner {
        disputeFee = _fee;
        emit SetDisputeFee(_fee);
    }

    function setQuestionFee(uint256 _fee) external onlyOwner {
        IRealityV3(REALITY_V3_ADDRESS).setQuestionFee(_fee);
    }

    function setMetaData(string memory _metadata) external onlyOwner {
        metadata = _metadata;
        emit SetMetadata(_metadata);
    }

    function submitAnswerByArbitrator(bytes32 _questionId, bytes32 _answer, address _answerer) external onlyOwner {
        IRealityV3(REALITY_V3_ADDRESS).submitAnswerByArbitrator(_questionId, _answer, _answerer);
    }

    function cancelArbitration(bytes32 _questionId) external onlyOwner {
        IRealityV3(REALITY_V3_ADDRESS).cancelArbitration(_questionId);
    }

    function requestArbitration(bytes32 _questionId, uint256 max_previous) external payable {
        if (msg.value < disputeFee) revert InsufficientFee();
        IRealityV3(REALITY_V3_ADDRESS).notifyOfArbitrationRequest(_questionId, msg.sender, max_previous);
    }

    function withdraw(address _address) external onlyOwner {
        uint256 _withdrawn = address(this).balance;
        (bool _success,) = payable(_address).call{value: _withdrawn}("");
        if (!_success) revert TransferFailed();
        emit Withdraw(_withdrawn);
    }
}
