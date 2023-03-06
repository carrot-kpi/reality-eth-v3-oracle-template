import { defaultAbiCoder } from "ethers/lib/utils.js";

interface DecodedData {
    realityV3Address: string;
    questionId: string;
    question: string;
}

export const decodeOracleData = (data: string): DecodedData | null => {
    const [realityV3Address, questionId, question] = defaultAbiCoder.decode(
        ["address", "bytes32", "string"],
        data
    ) as [string, string, string];
    return {
        realityV3Address,
        question,
        questionId,
    };
};
