import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { Chip, Typography } from "@carrot-kpi/ui";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import { ReactElement } from "react";
import { SupportedRealityTemplates } from "../../../commons";

interface AnswerProps {
    t: NamespacedTranslateFunction;
    finalized: boolean;
    answerInvalid: boolean;
    realityQuestionBond: BigNumber;
    realityTemplateType?: SupportedRealityTemplates;
    realityAnswer: BigNumber | null;
}

export const Answer = ({
    t,
    finalized,
    answerInvalid,
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

    return (
        <div>
            {realityTemplateType === SupportedRealityTemplates.BOOL && (
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
            )}
            {realityTemplateType === SupportedRealityTemplates.UINT && (
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
            )}
            {answerInvalid && (
                <Chip className={{ root: "bg-red/70" }}>
                    <Typography variant="lg" uppercase={true}>
                        {t("label.answer.invalid", {
                            bond: formatUnits(
                                realityQuestionBond,
                                nativeCurrency.decimals
                            ),
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
