import { decodeAbiParameters, type Address } from "viem";
import { type Hex } from "viem";

export const decodeOracleData = (
    data: Hex
): {
    realityV3Address: Address;
    questionId: Hex;
    question: string;
} => {
    const [realityV3Address, questionId, question] = decodeAbiParameters(
        [
            { type: "address", name: "realityV3Address" },
            { type: "bytes32", name: "questionId" },
            { type: "string", name: "question" },
        ],
        data
    ) as [Address, Hex, string];
    return {
        realityV3Address,
        question,
        questionId,
    };
};
