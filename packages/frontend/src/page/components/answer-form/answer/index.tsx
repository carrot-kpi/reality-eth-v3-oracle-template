import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Chip, Typography } from "@carrot-kpi/ui";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
import { BYTES32_ZERO } from "../../../../commons";
import {
    isQuestionAnsweredTooSoon,
    isQuestionAnswerInvalid,
    isQuestionAnswerMissing,
    isQuestionBoolean,
    isQuestionFinalized,
    isQuestionNumerical,
} from "../../../../utils";
import { RealityQuestion } from "../../../types";

interface AnswerProps {
    t: NamespacedTranslateFunction;
    question: RealityQuestion;
}

export const Answer = ({ t, question }: AnswerProps): ReactElement => {
    const nativeCurrency = useNativeCurrency();

    if (isQuestionAnswerMissing(question))
        return (
            <Typography variant="lg">{t("label.answer.missing")}</Typography>
        );

    const finalized = isQuestionFinalized(question);
    const formattedBond = formatUnits(question.bond, nativeCurrency.decimals);
    return (
        <div className="flex flex-col justify-between gap-3">
            {isQuestionBoolean(question) && (
                <Typography variant="lg">
                    {t("label.answer.answer", {
                        answer:
                            question.bestAnswer === BYTES32_ZERO
                                ? t("label.answer.no")
                                : t("label.answer.yes"),
                        bond: formattedBond,
                        symbol: nativeCurrency.symbol,
                    })}
                </Typography>
            )}
            {isQuestionNumerical(question) && (
                <Typography variant="lg">
                    {t("label.answer.answer", {
                        answer: formatUnits(
                            BigNumber.from(question.bestAnswer),
                            18
                        ),
                        bond: formattedBond,
                        symbol: nativeCurrency.symbol,
                    })}
                </Typography>
            )}
            {isQuestionAnswerInvalid(question) && (
                <Chip className={{ root: "bg-red w-fit" }}>
                    {t("label.answer.invalid", {
                        bond: formattedBond,
                        symbol: nativeCurrency.symbol,
                    })}
                </Chip>
            )}
            {isQuestionAnsweredTooSoon(question) && (
                <Chip className={{ root: "bg-yellow w-fit" }}>
                    {t("label.answer.tooSoon", {
                        bond: formattedBond,
                        symbol: nativeCurrency.symbol,
                    })}
                </Chip>
            )}
            {finalized && (
                <Chip className={{ root: "bg-green w-fit" }}>
                    {t("label.answer.finalized")}
                </Chip>
            )}
        </div>
    );
};
