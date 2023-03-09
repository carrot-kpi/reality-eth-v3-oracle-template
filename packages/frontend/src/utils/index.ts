import { BigNumber } from "ethers";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BYTES32_ZERO,
    INVALID_REALITY_ANSWER,
    REALITY_DAPP_ENDPOINT,
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

export const isAnswerMissing = (question: RealityQuestion) => {
    return question.bestAnswer === BYTES32_ZERO && question.bond.isZero();
};

export const isAnswerInvalid = (question: RealityQuestion) => {
    return question.bestAnswer === INVALID_REALITY_ANSWER;
};

export const isAnsweredTooSoon = (question: RealityQuestion) => {
    return question.bestAnswer === ANSWERED_TOO_SOON_REALITY_ANSWER;
};

export const isAnswerPurelyBoolean = (question: RealityQuestion) => {
    return (
        !isAnswerInvalid(question) &&
        !isAnsweredTooSoon(question) &&
        question.templateId === SupportedRealityTemplates.BOOL
    );
};

export const isAnswerPurelyNumerical = (question: RealityQuestion) => {
    return (
        !isAnswerInvalid(question) &&
        !isAnsweredTooSoon(question) &&
        question.templateId === SupportedRealityTemplates.UINT
    );
};

export const isQuestionReopenable = (question: RealityQuestion) => {
    if (!isQuestionFinalized(question)) {
        return false;
    }
    if (!isAnsweredTooSoon(question)) {
        return false;
    }
    return true;
};

export const formatCountDownString = (timeoutSeconds: number) => {
    if (timeoutSeconds <= 0) {
        return "00D 00H 00M";
    }

    const daysLeft = Math.floor(timeoutSeconds / 60 / 60 / 24);
    const hoursLeft = Math.floor((timeoutSeconds / 60 / 60) % 24);
    const minutesLeft = Math.floor((timeoutSeconds / 60) % 60);
    const secondsLeft = Math.floor(timeoutSeconds % 60);

    return `${daysLeft}D ${hoursLeft}H ${minutesLeft}M ${secondsLeft}S`;
};

export const formatRealityEthQuestionLink = (
    questionId: string,
    contractAddress: string
) => {
    return `${REALITY_DAPP_ENDPOINT}#!/question/${contractAddress}-${questionId}`;
};
