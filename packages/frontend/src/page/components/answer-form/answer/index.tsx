import { NamespacedTranslateFunction } from "@carrot-kpi/react";
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
} from "../../../../utils";
import { RealityQuestion } from "../../../types";
import { LearnMore } from "../../learn-more";

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
    const finalized = isQuestionFinalized(question);

    // TODO: display the bond somewhere
    // const formattedBond = formatUnits(question.bond, nativeCurrency.decimals);
    return (
        <div className="flex flex-col justify-between gap-3">
            {finalized ? (
                <>
                    <Typography
                        variant="h5"
                        weight="bold"
                        className={{ root: "mb-4" }}
                    >
                        {t("label.answer.finalized")}
                    </Typography>
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
                                <Typography>
                                    {t("label.answer.ask.reopen")}
                                </Typography>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col gap-3 border-l border-black dark:border-white pl-4">
                    <Typography variant="lg" uppercase>
                        {t("label.answer.current")}
                    </Typography>
                    {loadingQuestion ? (
                        <Skeleton width="150px" variant="2xl" />
                    ) : (
                        <>
                            {isAnswerMissing(question) && (
                                <Typography>
                                    {t("label.answer.form.missing")}
                                </Typography>
                            )}
                            {isAnswerPurelyBoolean(question) && (
                                <Typography>
                                    {question.bestAnswer === BYTES32_ZERO
                                        ? t("label.answer.form.no")
                                        : t("label.answer.form.yes")}
                                </Typography>
                            )}
                            {isAnswerPurelyNumerical(question) && (
                                <Typography>
                                    {utils.commify(
                                        formatUnits(
                                            BigNumber.from(question.bestAnswer),
                                            18
                                        )
                                    )}
                                </Typography>
                            )}
                            {isAnswerInvalid(question) && (
                                <Typography>
                                    {t("label.answer.form.invalid")}
                                </Typography>
                            )}
                            {isAnsweredTooSoon(question) && (
                                <Typography>
                                    {t("label.answer.form.tooSoon")}
                                </Typography>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
