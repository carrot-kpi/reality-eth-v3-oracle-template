import { ethers } from "ethers";

interface DecodedData {
    realityV3Address: string;
    questionId: string;
    question: string;
}

export const decodeOracleData = (data: string): DecodedData | null => {
    const [realityV3Address, questionId, question] =
        ethers.utils.defaultAbiCoder.decode(
            ["address", "bytes32", "string"],
            data
        ) as [string, string, string];
    return {
        realityV3Address,
        question,
        questionId,
    };
};
