import { useNativeCurrency } from "@carrot-kpi/react";
import { Skeleton, Timer, Typography } from "@carrot-kpi/ui";
import { cva } from "class-variance-authority";
import { useEffect, useState, type ReactElement } from "react";
import { formatUnits } from "viem";
import { BYTES32_ZERO } from "../../../../commons";
import {
    isAnswerInvalid,
    isAnswerMissing,
    isAnswerPendingArbitration,
    isAnswerPurelyBoolean,
    isAnswerPurelyNumerical,
    isAnsweredTooSoon,
    isQuestionFinalized,
} from "../../../../utils";
import type { RealityQuestion } from "../../../types";
import { AnswerInfo } from "../../answer-info";

const answerBoxStyles = cva(
    [
        "w-full",
        "flex",
        "flex-col",
        "md:flex-row",
        "justify-between",
        "border-r-0",
        "border-black",
        "dark:border-white",
    ],
    {
        variants: {
            pendingArbitration: {
                false: ["md:w-2/3", "md:border-r"],
            },
        },
    }
);

const bondBoxStyles = cva(
    [
        "w-full",
        "border-b",
        "md:border-b-0",
        "border-black",
        "dark:border-white",
    ],
    {
        variants: {
            pendingArbitration: {
                false: ["md:w-1/3"],
            },
        },
    }
);

interface AnswerProps {
    question: RealityQuestion;
    loadingQuestion: boolean;
}

export const Answer = ({
    question,
    loadingQuestion,
}: AnswerProps): ReactElement => {
    const nativeCurrency = useNativeCurrency();
    const finalized = isQuestionFinalized(question);

    const [currentAnswerValue, setCurrentAnswerValue] = useState("");

    const formattedBond = formatUnits(question.bond, nativeCurrency.decimals);
    const pendingArbitration = isAnswerPendingArbitration(question);

    const currentAnswerTitle = finalized ? "Test" : "Test";
    const finalizingInLabel = isAnswerMissing(question)
        ? "-"
        : finalized
        ? "Test"
        : null;

    useEffect(() => {
        if (loadingQuestion) return; // do nothing

        const purelyBoolean = isAnswerPurelyBoolean(question);
        const purelyNumerical = isAnswerPurelyNumerical(question);
        const invalid = isAnswerInvalid(question);
        const answeredTooSoon = isAnsweredTooSoon(question);
        let newValue = "";

        if (pendingArbitration) newValue = "Test";
        else if (isAnswerMissing(question)) newValue = "Test";
        else if (purelyBoolean)
            newValue = question.bestAnswer === BYTES32_ZERO ? "Test" : "Test";
        else if (purelyNumerical)
            /* FIXME: reintroduce commify to make number easier to read */
            newValue = formatUnits(BigInt(question.bestAnswer), 18);
        else if (invalid) newValue = "Test";
        else if (answeredTooSoon) newValue = "Test";

        setCurrentAnswerValue(newValue);
    }, [loadingQuestion, pendingArbitration, question]);

    return (
        <div className="flex flex-col md:flex-row justify-between border-b-0 md:border-b border-black dark:border-white">
            <div className={answerBoxStyles({ pendingArbitration })}>
                <AnswerInfo
                    label={currentAnswerTitle}
                    className={
                        !pendingArbitration
                            ? "border-b md:border-b-0 border-black dark:border-white"
                            : undefined
                    }
                >
                    {loadingQuestion && !currentAnswerValue ? (
                        <Skeleton width="220px" variant="xl" />
                    ) : (
                        <Typography>{currentAnswerValue}</Typography>
                    )}
                </AnswerInfo>
                {!pendingArbitration && (
                    <AnswerInfo
                        label={"Test"}
                        className={
                            "border-b md:border-b-0 border-r-0 border-black dark:border-white"
                        }
                    >
                        {!!finalizingInLabel ? (
                            <Typography>{finalizingInLabel}</Typography>
                        ) : (
                            // TODO: Timer could support bigint values
                            <Timer
                                to={question.finalizationTimestamp}
                                seconds
                                countdown
                            />
                        )}
                    </AnswerInfo>
                )}
            </div>
            {!pendingArbitration && (
                <AnswerInfo
                    label={"Test"}
                    className={bondBoxStyles({ pendingArbitration })}
                >
                    <Typography>
                        {/* FIXME: reintroduce commify to make number easier to read */}
                        {`${formattedBond} ${nativeCurrency.symbol}`}
                    </Typography>
                </AnswerInfo>
            )}
        </div>
    );
};
