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

    return (
        <Typography variant="lg">
            {realityTemplateType !== SupportedRealityTemplates.BOOL
                ? formatUnits(BigNumber.from(realityAnswer), 18)
                : BigNumber.from(realityAnswer).eq("1")
                ? "YES"
                : "NO"}{" "}
            (${formatUnits(realityQuestionBond, nativeCurrency.decimals)} $
            {nativeCurrency.symbol} bonded)
        </Typography>
    );
};
