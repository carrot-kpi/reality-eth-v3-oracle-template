import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Skeleton, Typography } from "@carrot-kpi/ui";
import { BigNumber, utils } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
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
import { RealityQuestion } from "../../../types";
import { AnswerInfo } from "../../answer-info";

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
        currentAnswerValue = utils.commify(
            formatUnits(BigNumber.from(question.bestAnswer), 18)
        );
    } else if (invalid) {
        currentAnswerValue = t("label.answer.form.invalid");
    } else if (answeredTooSoon) {
        currentAnswerValue = t("label.answer.form.tooSoon");
    }

    return (
        <div className="flex flex-col justify-between gap-3">
            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 border-black border-b">
                <AnswerInfo
                    label={currentAnswerTitle}
                    className={
                        !pendingArbitration
                            ? "border-r border-black"
                            : undefined
                    }
                >
                    {loadingQuestion ? (
                        <Skeleton width="220px" variant="2xl" />
                    ) : (
                        <Typography>{currentAnswerValue}</Typography>
                    )}
                </AnswerInfo>
                {!pendingArbitration && (
                    <AnswerInfo label={t("label.answer.form.bonded")}>
                        {loadingQuestion ? (
                            <Skeleton width="150px" variant="2xl" />
                        ) : (
                            <Typography>
                                {`${utils.commify(formattedBond)} ${
                                    nativeCurrency.symbol
                                }`}
                            </Typography>
                        )}
                    </AnswerInfo>
                )}
            </div>
        </div>
    );
};
