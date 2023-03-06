import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Chip, Typography } from "@carrot-kpi/ui";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
import { BYTES32_ZERO, SupportedRealityTemplates } from "../../../../commons";
import {
    isQuestionAnswerInvalid,
    isQuestionAnswerMissing,
    isQuestionFinalized,
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
        <div>
            {question.templateId === SupportedRealityTemplates.BOOL && (
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
            {question.templateId === SupportedRealityTemplates.UINT && (
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
                <Chip className={{ root: "bg-red/70" }}>
                    <Typography variant="lg" uppercase={true}>
                        {t("label.answer.invalid", {
                            bond: formattedBond,
                            symbol: nativeCurrency.symbol,
                        })}
                    </Typography>
                </Chip>
            )}
            {finalized && (
                <Chip className={{ root: "bg-green/70" }}>
                    <Typography variant="lg" uppercase={true}>
                        {t("label.answer.finalized")}
                    </Typography>
                </Chip>
            )}
        </div>
    );
};
