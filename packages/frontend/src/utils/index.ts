import { BigNumber } from "ethers";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BYTES32_ZERO,
    INVALID_REALITY_ANSWER,
    SupportedRealityTemplates,
} from "../commons";
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
    return (
        question.finalizationTimestamp !== 0 &&
        question.finalizationTimestamp < dayjs().unix()
    );
};

export const isQuestionAnswerMissing = (question: RealityQuestion) => {
    return question.bestAnswer === BYTES32_ZERO && question.bond.isZero();
};

export const isQuestionAnswerInvalid = (question: RealityQuestion) => {
    return question.bestAnswer === INVALID_REALITY_ANSWER;
};

export const isQuestionAnsweredTooSoon = (question: RealityQuestion) => {
    return question.bestAnswer === ANSWERED_TOO_SOON_REALITY_ANSWER;
};

export const isQuestionBoolean = (question: RealityQuestion) => {
    return (
        !isQuestionAnswerInvalid(question) &&
        !isQuestionAnsweredTooSoon(question) &&
        question.templateId === SupportedRealityTemplates.BOOL
    );
};

export const isQuestionNumerical = (question: RealityQuestion) => {
    return (
        !isQuestionAnswerInvalid(question) &&
        !isQuestionAnsweredTooSoon(question) &&
        question.templateId === SupportedRealityTemplates.UINT
    );
};

export const isQuestionReopenable = (question: RealityQuestion) => {
    if (!isQuestionFinalized(question)) {
        return false;
    }
    if (!isQuestionAnsweredTooSoon(question)) {
        return false;
    }
    return true;
};
