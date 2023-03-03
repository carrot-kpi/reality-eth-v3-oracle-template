import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Typography } from "@carrot-kpi/ui";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
import { SupportedRealityTemplates } from "../../../commons";

interface AnswerProps {
    t: NamespacedTranslateFunction;
    currentAnswerInvalid: boolean;
    realityQuestionBond: BigNumber;
    realityTemplateType?: SupportedRealityTemplates;
    realityAnswer: BigNumber | null;
}

export const Answer = ({
    t,
    currentAnswerInvalid,
    realityQuestionBond,
    realityTemplateType,
    realityAnswer,
}: AnswerProps): ReactElement => {
    const nativeCurrency = useNativeCurrency();

    if (realityQuestionBond.isZero() || !realityAnswer) {
        return (
            <Typography variant="lg">{t("label.answer.missing")}</Typography>
        );
    }

    if (currentAnswerInvalid) {
        return (
            <Typography variant="lg">
                {t("label.answer.invalid", {
                    bond: formatUnits(
                        realityQuestionBond,
                        nativeCurrency.decimals
                    ),
                    symbol: nativeCurrency.symbol,
                })}
            </Typography>
        );
    }

    if (realityTemplateType === SupportedRealityTemplates.BOOL) {
        return (
            <Typography variant="lg">
                {t("label.answer.answer", {
                    answer: realityAnswer.eq("1")
                        ? t("label.answer.yes")
                        : t("label.answer.no"),
                    bond: formatUnits(
                        realityQuestionBond,
                        nativeCurrency.decimals
                    ),
                    symbol: nativeCurrency.symbol,
                })}
            </Typography>
        );
    }

    if (realityTemplateType === SupportedRealityTemplates.UINT) {
        return (
            <Typography variant="lg">
                {t("label.answer.answer", {
                    answer: formatUnits(BigNumber.from(realityAnswer), 18),
                    bond: formatUnits(
                        realityQuestionBond,
                        nativeCurrency.decimals
                    ),
                    symbol: nativeCurrency.symbol,
                })}
            </Typography>
        );
    }

    return <></>;
};
