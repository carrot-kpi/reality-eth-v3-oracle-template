import { BigNumber } from "ethers";
import { BYTES32_ZERO, INVALID_REALITY_ANSWER } from "../commons";
import { RealityQuestion } from "../page/types";
import dayjs from "dayjs";

// TODO: find a better way to encode the answer values
export const numberToByte32 = (num: string | number): string => {
    const hex = BigNumber.from(num).toHexString();

    const frontZeros = "0".repeat(66 - hex.length);

    return `0x${frontZeros}${hex.split("0x")[1]}`;
};

export const shortenAddress = (address?: string) => {
    return address
        ? `${address.slice(0, 6)}...${address.substring(38)}`
        : undefined;
};

export const isQuestionFinalized = (question: RealityQuestion) => {
    return question.finalizationTimestamp < dayjs().unix();
};

export const isQuestionAnswerMissing = (question: RealityQuestion) => {
    return question.bestAnswer === BYTES32_ZERO && question.bond.isZero();
};

export const isQuestionAnswerInvalid = (question: RealityQuestion) => {
    return question.bestAnswer === INVALID_REALITY_ANSWER;
};
