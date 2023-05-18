import { decodeAbiParameters } from "viem";
import { type Address } from "viem";

interface DecodedData {
    realityV3Address: string;
    questionId: string;
    question: string;
}

export const decodeOracleData = (data: string): DecodedData | null => {
    const [realityV3Address, questionId, question] = decodeAbiParameters(
        [
            { type: "address", name: "realityV3Address" },
            { typr: "bytes32", name: "question" },
            { type: "string", name: "questionId" },
        ],
        data as Address
    ) as [string, string, string];
    return {
        realityV3Address,
        question,
        questionId,
    };
};
