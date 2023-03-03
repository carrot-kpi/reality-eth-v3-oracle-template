import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
    Markdown,
    NumberInput,
    Select,
    SelectOption,
    Timer,
    Typography,
} from "@carrot-kpi/ui";
import { BigNumber, utils } from "ethers";
import { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useNetwork } from "wagmi";
import { SupportedRealityTemplates } from "../../../commons";
import { usePostRealityAnswer } from "../../../hooks/usePostRealityAnswer";
import { isInThePast, numberToByte32 } from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "../answer";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityTemplateType?: SupportedRealityTemplates;
    realityQuestion: RealityQuestion;
    questionContent: string;
}

export const AnswerForm = ({
    t,
    realityTemplateType,
    realityQuestion,
    questionContent,
}: AnswerFormProps): ReactElement => {
    const [booleanValue, setBooleanValue] = useState<SelectOption | null>(null);
    const [numberValue, setNumberValue] = useState<NumberFormatValue>({
        formattedValue: "",
        value: "",
    });
    const [finalAnswer, setFinalAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [minimumBond, setMinimumBond] = useState<BigNumber>(
        realityQuestion.minBond
    );

    const { chain } = useNetwork();
    const { defaultBondValue, defaultFormatteBondValue } = useMemo(() => {
        const defaultValue = realityQuestion.bond.isZero()
            ? utils.formatUnits(
                  realityQuestion.minBond.toString(),
                  chain?.nativeCurrency.decimals
              )
            : utils.formatUnits(
                  realityQuestion.bond.toString(),
                  chain?.nativeCurrency.decimals
              );
        const defaultFormattedValue = !!defaultValue
            ? utils.commify(defaultValue)
            : "";
        return {
            defaultBondValue: defaultValue,
            defaultFormatteBondValue: defaultFormattedValue,
        };
    }, [
        realityQuestion.bond,
        realityQuestion.minBond,
        chain?.nativeCurrency.decimals,
    ]);

    const [bond, setBond] = useState<NumberFormatValue>({
        value: defaultBondValue,
        formattedValue: defaultFormatteBondValue,
    });

    const submitEnabled = useMemo(() => {
        if (!chain || !bond.value) return false;
        if (
            utils
                .parseUnits(bond.value, chain.nativeCurrency.decimals)
                .lt(minimumBond)
        )
            return false;
        if (realityTemplateType === SupportedRealityTemplates.BOOL)
            return !!booleanValue;
        if (realityTemplateType === SupportedRealityTemplates.UINT)
            return !!numberValue;
        return false;
    }, [
        realityTemplateType,
        booleanValue,
        numberValue,
        bond.value,
        minimumBond,
        chain,
    ]);

    const currentAnswerInvalid = useMemo(() => {
        if (!realityQuestion) return;

        // TODO: handle case of invalid reality answer
        // return !realityQuestion.bond.isZero();
        // realityQuestion.bestAnswer.eq(INVALID_REALITY_ANSWER)
        return false;
    }, [realityQuestion]);

    const realityQuestionOpen = useMemo(() => {
        if (!realityQuestion) return;
        return isInThePast(new Date(realityQuestion.openingTimestamp * 1_000));
    }, [realityQuestion]);

    useEffect(() => {
        if (realityQuestion.bond) setMinimumBond(realityQuestion.bond.mul(2));
        setMinimumBond(realityQuestion.minBond);
    }, [realityQuestion.bond, realityQuestion.minBond]);

    useEffect(() => {
        if (booleanValue) setFinalAnswer(numberToByte32(booleanValue.value));
        if (!isNaN(parseFloat(numberValue.value)))
            setFinalAnswer(
                numberToByte32(
                    utils.parseUnits(numberValue.value, 18).toString()
                )
            );
    }, [booleanValue, numberValue, chain?.nativeCurrency.decimals]);

    const { postAnswerAsync } = usePostRealityAnswer(
        utils.parseUnits(bond.value || "0"),
        finalAnswer,
        realityQuestion.id
    );

    const handleSubmit = useCallback(() => {
        if (!postAnswerAsync) return;
        let cancelled = false;
        const submit = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await postAnswerAsync();
                await tx.wait();
                if (cancelled) return;
            } catch (error) {
                console.error("error submitting answer to reality v3", error);
            } finally {
                if (!cancelled) setSubmitting(false);
            }
        };
        void submit();
        return () => {
            cancelled = true;
        };
    }, [postAnswerAsync]);

    if (realityQuestion.pendingArbitration) return <></>;

    return (
        <div className="flex flex-col gap-6">
            {!!realityQuestionOpen ? (
                <>
                    <Markdown>{questionContent}</Markdown>
                    {realityTemplateType === SupportedRealityTemplates.BOOL && (
                        <Select
                            id="bool-template"
                            label={t("label.question.form.answer")}
                            value={booleanValue}
                            onChange={setBooleanValue}
                            options={[
                                { label: "Yes", value: 1 },
                                { label: "No", value: 0 },
                            ]}
                        />
                    )}
                    {realityTemplateType === SupportedRealityTemplates.UINT && (
                        <NumberInput
                            id="uint-template"
                            placeholder={"0.0"}
                            allowNegative={false}
                            min={0}
                            label={t("label.question.form.answer")}
                            value={numberValue.formattedValue}
                            onValueChange={setNumberValue}
                        />
                    )}
                    <NumberInput
                        id="bond"
                        placeholder={"0.0"}
                        allowNegative={false}
                        min={0}
                        label={t("label.question.form.bond")}
                        value={bond.formattedValue}
                        onValueChange={setBond}
                    />
                    <Answer
                        t={t}
                        currentAnswerInvalid={!!currentAnswerInvalid}
                        realityQuestionBond={realityQuestion.bond}
                        realityTemplateType={realityTemplateType}
                        realityAnswer={BigNumber.from(
                            realityQuestion.bestAnswer
                        )}
                    />
                </>
            ) : (
                <>
                    <Typography>{t("label.question.notOpen")}</Typography>
                    <div className="flex gap-2">
                        <Typography>{t("label.question.openingIn")}</Typography>
                        <Timer
                            icon={true}
                            to={realityQuestion.openingTimestamp * 1_000}
                            countdown={true}
                        />
                    </div>
                </>
            )}
            <Button
                onClick={handleSubmit}
                disabled={!submitEnabled}
                loading={submitting}
            >
                {t("label.question.form.confirm")}
            </Button>
        </div>
    );
};
