import {
    type NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Timer, Typography } from "@carrot-kpi/ui";
import { cva } from "class-variance-authority";
import type { ReactElement } from "react";
import { BYTES32_ZERO } from "../../../../commons";
import {
    isAnsweredTooSoon,
    isAnswerInvalid,
    isAnswerPurelyBoolean,
    isQuestionFinalized,
    isAnswerPurelyNumerical,
    isAnswerMissing,
    isAnswerPendingArbitration,
} from "../../../../utils";
import type { RealityQuestion } from "../../../types";
import { AnswerInfo } from "../../answer-info";
import { formatUnits } from "viem";

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
    t: NamespacedTranslateFunction;
    question: RealityQuestion;
    loadingQuestion: boolean;
}

export const Answer = ({
    t,
    question,
    loadingQuestion,
}: AnswerProps): ReactElement => {
    const nativeCurrency = useNativeCurrency();
    const finalized = isQuestionFinalized(question);

    const formattedBond = formatUnits(question.bond, nativeCurrency.decimals);
    const purelyBoolean = isAnswerPurelyBoolean(question);
    const purelyNumerical = isAnswerPurelyNumerical(question);
    const invalid = isAnswerInvalid(question);
    const answeredTooSoon = isAnsweredTooSoon(question);
    const pendingArbitration = isAnswerPendingArbitration(question);

    const currentAnswerTitle = finalized
        ? t("label.answer.final")
        : t("label.answer.current");
    const finalizingInLabel = isAnswerMissing(question)
        ? "-"
        : finalized
        ? t("label.answer.form.finalized")
        : null;
    let currentAnswerValue = null;

    if (loadingQuestion) {
        // do nothing
    } else if (pendingArbitration) {
        currentAnswerValue = t("label.answer.arbitrating");
    } else if (isAnswerMissing(question)) {
        currentAnswerValue = t("label.answer.form.missing");
    } else if (purelyBoolean) {
        currentAnswerValue =
            question.bestAnswer === BYTES32_ZERO
                ? t("label.answer.form.no")
                : t("label.answer.form.yes");
    } else if (purelyNumerical) {
        {
            /* FIXME: reintroduce commify to make number easier to read */
        }
        currentAnswerValue = formatUnits(BigInt(question.bestAnswer), 18);
    } else if (invalid) {
        currentAnswerValue = t("label.answer.form.invalid");
    } else if (answeredTooSoon) {
        currentAnswerValue = t("label.answer.form.tooSoon");
    }

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
                    <Typography>{currentAnswerValue}</Typography>
                </AnswerInfo>
                {!pendingArbitration && (
                    <AnswerInfo
                        label={t("label.answer.form.finalizingIn")}
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
                    label={t("label.answer.form.bonded")}
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
