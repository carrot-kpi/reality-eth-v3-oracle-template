import { decodeAbiParameters } from "viem";
import { type Hex } from "viem";

export const decodeOracleData = (data: Hex) => {
    const [realityV3Address, questionId, question] = decodeAbiParameters(
        [
            { type: "address", name: "realityV3Address" },
            { type: "bytes32", name: "question" },
            { type: "string", name: "questionId" },
        ],
        data
    );
    return {
        realityV3Address,
        question,
        questionId,
    };
};
