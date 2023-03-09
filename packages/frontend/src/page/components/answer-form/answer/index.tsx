import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { Typography } from "@carrot-kpi/ui";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
import { BYTES32_ZERO } from "../../../../commons";
import {
    isAnsweredTooSoon,
    isAnswerInvalid,
    isAnswerMissing,
    isAnswerPurelyBoolean,
    isQuestionFinalized,
    isAnswerPurelyNumerical,
} from "../../../../utils";
import { RealityQuestion } from "../../../types";
import { LearnMore } from "../../learn-more";

interface AnswerProps {
    t: NamespacedTranslateFunction;
    question: RealityQuestion;
}

export const Answer = ({ t, question }: AnswerProps): ReactElement => {
    if (isAnswerMissing(question))
        return (
            <Typography variant="lg">{t("label.answer.missing")}</Typography>
        );

    const finalized = isQuestionFinalized(question);
    // TODO: display the bond somewhere
    // const formattedBond = formatUnits(question.bond, nativeCurrency.decimals);
    return (
        <div className="flex flex-col justify-between gap-3">
            {finalized && (
                <Typography
                    variant="h5"
                    weight="bold"
                    className={{ root: "mb-4" }}
                >
                    {t("label.answer.finalized")}
                </Typography>
            )}
            {isAnswerPurelyBoolean(question) && (
                <div className="flex flex-col gap-1">
                    <Typography>
                        {t("label.answer.answer", {
                            answer:
                                question.bestAnswer === BYTES32_ZERO
                                    ? t("label.answer.form.no")
                                    : t("label.answer.form.yes"),
                        })}
                    </Typography>
                    <LearnMore t={t} />
                </div>
            )}
            {isAnswerPurelyNumerical(question) && (
                <div className="flex flex-col gap-1">
                    <Typography>
                        {t("label.answer.answer", {
                            answer: formatUnits(
                                BigNumber.from(question.bestAnswer),
                                18
                            ),
                        })}
                    </Typography>
                    <LearnMore t={t} />
                </div>
            )}
            {isAnswerInvalid(question) && (
                <div className="flex flex-col gap-1">
                    <Typography>
                        {t("label.answer.marked.as", {
                            outcome: t("label.answer.form.invalid"),
                        })}
                    </Typography>
                    <LearnMore t={t} />
                </div>
            )}
            {isAnsweredTooSoon(question) && (
                <div className="flex flex-col gap-1">
                    <Typography>
                        {t("label.answer.marked.as", {
                            outcome: t("label.answer.form.tooSoon"),
                        })}
                    </Typography>
                    {finalized && (
                        <Typography>{t("label.answer.ask.reopen")}</Typography>
                    )}
                </div>
            )}
        </div>
    );
};
