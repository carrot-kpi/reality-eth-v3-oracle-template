import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
    Checkbox,
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
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    INVALID_REALITY_ANSWER,
    SupportedRealityTemplates,
} from "../../../commons";
import { usePostRealityAnswer } from "../../../hooks/usePostRealityAnswer";
import { numberToByte32 } from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "../answer";
import { cva } from "class-variance-authority";
import dayjs from "dayjs";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityTemplateType?: SupportedRealityTemplates;
    realityQuestion: RealityQuestion;
    questionContent: string;
}

const answerInputWrapperStyles = cva(
    ["flex gap-4 opacity-100 transition-opacity"],
    {
        variants: {
            disabled: {
                true: ["opacity-20", "pointer-events-none", "cursor-no-drop"],
            },
        },
    }
);

const checkBoxStyles = cva(["opacity-100 transition-opacity"], {
    variants: {
        disabled: {
            true: ["opacity-20", "pointer-events-none", "cursor-no-drop"],
        },
    },
});

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
    const [finalized, setFinalized] = useState(
        realityQuestion.finalizationTimestamp !== 0
    );
    const [moreOptionValue, setMoreOptionValue] = useState({
        invalid: false,
        anweredTooSoon: false,
    });
    const [answerInputDisabled, setAnswerInputDisabled] = useState(false);

    const moreOptionSelected =
        moreOptionValue.invalid || moreOptionValue.anweredTooSoon;

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

    const { postAnswerAsync } = usePostRealityAnswer(
        utils.parseUnits(bond.value || "0"),
        finalAnswer,
        realityQuestion.id
    );

    const submitEnabled = useMemo(() => {
        if (!postAnswerAsync) return false;
        if (!chain || !bond.value) return false;
        if (
            utils
                .parseUnits(bond.value, chain.nativeCurrency.decimals)
                .lt(minimumBond)
        )
            return false;
        if (
            !moreOptionSelected &&
            realityTemplateType === SupportedRealityTemplates.BOOL
        )
            return !!booleanValue;
        if (
            !moreOptionSelected &&
            realityTemplateType === SupportedRealityTemplates.UINT
        )
            return !!numberValue;
        return true;
    }, [
        postAnswerAsync,
        moreOptionSelected,
        realityTemplateType,
        booleanValue,
        numberValue,
        bond.value,
        minimumBond,
        chain,
    ]);

    const answerInvalid = useMemo(() => {
        if (!realityQuestion) return false;
        console.log("ANSWER", realityQuestion.bestAnswer);
        return (
            !realityQuestion.bond.isZero() &&
            // FIXME: error when parsing units of ANSWERED_TOO_SOON
            utils
                .parseUnits(realityQuestion.bestAnswer, 18)
                .eq(INVALID_REALITY_ANSWER)
        );
    }, [realityQuestion]);

    useEffect(() => {
        setFinalized(realityQuestion.finalizationTimestamp !== 0);
    }, [realityQuestion.finalizationTimestamp]);

    useEffect(() => {
        if (realityQuestion.bond) setMinimumBond(realityQuestion.bond.mul(2));
        setMinimumBond(realityQuestion.minBond);
    }, [realityQuestion.bond, realityQuestion.minBond]);

    useEffect(() => {
        if (moreOptionValue.anweredTooSoon)
            return setFinalAnswer(
                ANSWERED_TOO_SOON_REALITY_ANSWER.toHexString()
            );
        if (moreOptionValue.invalid)
            return setFinalAnswer(INVALID_REALITY_ANSWER.toHexString());
        if (booleanValue)
            return setFinalAnswer(numberToByte32(booleanValue.value));
        if (!isNaN(parseFloat(numberValue.value)))
            return setFinalAnswer(
                numberToByte32(
                    utils.parseUnits(numberValue.value, 18).toString()
                )
            );
    }, [
        moreOptionValue,
        booleanValue,
        numberValue,
        chain?.nativeCurrency.decimals,
    ]);

    useEffect(() => {
        if (finalized) return setAnswerInputDisabled(true);
        if (moreOptionValue.invalid || moreOptionValue.anweredTooSoon)
            return setAnswerInputDisabled(true);

        setAnswerInputDisabled(false);
    }, [finalized, moreOptionValue]);

    const handleInvalidChange = useCallback(() => {
        setMoreOptionValue((previous) => ({
            ...previous,
            invalid: !previous.invalid,
        }));
    }, []);
    const handleAnsweredTooSoonChange = useCallback(() => {
        setMoreOptionValue((previous) => ({
            ...previous,
            anweredTooSoon: !previous.anweredTooSoon,
        }));
    }, []);

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

    return (
        <div className="flex flex-col gap-6">
            {dayjs(dayjs.unix(realityQuestion.openingTimestamp)).isBefore(
                dayjs()
            ) ? (
                <>
                    <Markdown>{questionContent}</Markdown>
                    <div
                        className={answerInputWrapperStyles({
                            disabled: answerInputDisabled,
                        })}
                    >
                        {realityTemplateType ===
                            SupportedRealityTemplates.BOOL && (
                            <Select
                                id="bool-template"
                                label={t("label.question.form.answer")}
                                placeholder={t(
                                    "label.question.form.answer.select"
                                )}
                                value={booleanValue}
                                disabled={answerInputDisabled}
                                onChange={setBooleanValue}
                                options={[
                                    { label: "Yes", value: 1 },
                                    { label: "No", value: 0 },
                                ]}
                            />
                        )}
                        {realityTemplateType ===
                            SupportedRealityTemplates.UINT && (
                            <NumberInput
                                id="uint-template"
                                label={t("label.question.form.answer")}
                                placeholder={"0.0"}
                                allowNegative={false}
                                min={0}
                                value={numberValue.formattedValue}
                                disabled={answerInputDisabled}
                                onValueChange={setNumberValue}
                            />
                        )}
                    </div>
                    <NumberInput
                        id="bond"
                        label={t("label.question.form.bond")}
                        placeholder={"0.0"}
                        allowNegative={false}
                        min={0}
                        value={bond.formattedValue}
                        disabled={finalized}
                        onValueChange={setBond}
                    />
                    <Checkbox
                        id="invalid"
                        label={t("label.question.form.invalid")}
                        checked={moreOptionValue.invalid}
                        onChange={handleInvalidChange}
                        className={{
                            root: checkBoxStyles({
                                disabled: moreOptionValue.anweredTooSoon,
                            }),
                        }}
                    />
                    <Checkbox
                        id="too-soon"
                        label={t("label.question.form.tooSoon")}
                        checked={moreOptionValue.anweredTooSoon}
                        onChange={handleAnsweredTooSoonChange}
                        className={{
                            root: checkBoxStyles({
                                disabled: moreOptionValue.invalid,
                            }),
                        }}
                    />
                    <Answer
                        t={t}
                        finalized={finalized}
                        answerInvalid={answerInvalid}
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
            {!finalized && (
                <Button
                    onClick={handleSubmit}
                    disabled={!submitEnabled}
                    loading={submitting}
                >
                    {t("label.question.form.confirm")}
                </Button>
            )}
        </div>
    );
};
