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
    const purelyBoolean = isAnswerPurelyBoolean(question);
    const purelyNumerical = isAnswerPurelyNumerical(question);
    const invalid = isAnswerInvalid(question);
    const answeredTooSoon = isAnsweredTooSoon(question);

    return (
        <div className="flex flex-col justify-between gap-3">
            {finalized ? (
                <>
                    <Typography
                        variant="h5"
                        weight="bold"
                        className={{ root: "mb-4" }}
                    >
                        {purelyBoolean || purelyNumerical
                            ? t("label.answer.final.answer")
                            : t("label.answer.finalized")}
                    </Typography>
                    {purelyBoolean && (
                        <div className="flex flex-col gap-1">
                            <Typography variant="lg">
                                {question.bestAnswer === BYTES32_ZERO
                                    ? t("label.answer.form.no")
                                    : t("label.answer.form.yes")}
                            </Typography>
                            <LearnMore t={t} />
                        </div>
                    )}
                    {purelyNumerical && (
                        <div className="flex flex-col gap-1">
                            <Typography variant="lg">
                                {utils.commify(
                                    formatUnits(
                                        BigNumber.from(question.bestAnswer),
                                        18
                                    )
                                )}
                            </Typography>
                            <LearnMore t={t} />
                        </div>
                    )}
                    {invalid && (
                        <div className="flex flex-col gap-1">
                            <Typography variant="lg">
                                {t("label.answer.marked.as", {
                                    outcome: t("label.answer.form.invalid"),
                                })}
                            </Typography>
                            <LearnMore t={t} />
                        </div>
                    )}
                    {answeredTooSoon && (
                        <div className="flex flex-col gap-1">
                            <Typography variant="lg">
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
                            {purelyBoolean && (
                                <Typography>
                                    {question.bestAnswer === BYTES32_ZERO
                                        ? t("label.answer.form.no")
                                        : t("label.answer.form.yes")}
                                </Typography>
                            )}
                            {purelyNumerical && (
                                <Typography>
                                    {utils.commify(
                                        formatUnits(
                                            BigNumber.from(question.bestAnswer),
                                            18
                                        )
                                    )}
                                </Typography>
                            )}
                            {invalid && (
                                <Typography>
                                    {t("label.answer.form.invalid")}
                                </Typography>
                            )}
                            {answeredTooSoon && (
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
