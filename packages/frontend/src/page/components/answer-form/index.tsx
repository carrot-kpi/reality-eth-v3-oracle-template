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
import { ReactElement, useCallback, useEffect, useState } from "react";
import { usePrepareContractWrite, useContractWrite } from "wagmi";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    INVALID_REALITY_ANSWER,
    SupportedRealityTemplates,
} from "../../../commons";
import { isQuestionFinalized, numberToByte32 } from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "./answer";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3.json";
import { BondInput } from "./bond-input";
import dayjs from "dayjs";
import { inputStyles } from "./common/styles";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityAddress: string;
    question: RealityQuestion;
}

export const AnswerForm = ({
    t,
    realityAddress,
    question,
}: AnswerFormProps): ReactElement => {
    const [booleanValue, setBooleanValue] = useState<SelectOption | null>(null);
    const [numberValue, setNumberValue] = useState<NumberFormatValue>({
        formattedValue: "",
        value: "",
    });
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [moreOptionValue, setMoreOptionValue] = useState({
        invalid: false,
        anweredTooSoon: false,
    });

    const [bond, setBond] = useState<BigNumber | null>(null);

    const { config } = usePrepareContractWrite({
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "submitAnswer",
        args: [question.id, answer, BigNumber.from(0)],
        overrides: {
            value: bond || BigNumber.from(0),
        },
        enabled:
            !!answer &&
            !!bond &&
            bond.gt(
                question.bond.isZero() ? question.minBond : question.bond.mul(2)
            ),
    });
    const { writeAsync: postAnswerAsync } = useContractWrite(config);

    useEffect(() => {
        if (moreOptionValue.anweredTooSoon)
            return setAnswer(ANSWERED_TOO_SOON_REALITY_ANSWER);
        if (moreOptionValue.invalid) return setAnswer(INVALID_REALITY_ANSWER);
        if (booleanValue) return setAnswer(numberToByte32(booleanValue.value));
        if (!isNaN(parseFloat(numberValue.value)))
            return setAnswer(
                numberToByte32(
                    utils.parseUnits(numberValue.value, 18).toString()
                )
            );
    }, [
        booleanValue,
        moreOptionValue.anweredTooSoon,
        moreOptionValue.invalid,
        numberValue.value,
    ]);

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

    if (question.pendingArbitration) return <></>;

    const open = question.openingTimestamp < dayjs().unix();
    const finalized = isQuestionFinalized(question);
    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;

    return (
        <div className="flex flex-col gap-6">
            {open ? (
                <>
                    <Markdown>{question.content}</Markdown>
                    <div className="h-[1px] bg-black dark:bg-white w-full" />
                    <div className="flex gap-6 justify-between">
                        {question.templateId ===
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
                                className={{
                                    root: "w-full",
                                    input: "w-full",
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                        )}
                        {question.templateId ===
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
                                className={{
                                    root: "w-full",
                                    input: "w-full",
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                        )}
                        <BondInput
                            t={t}
                            value={bond}
                            onChange={setBond}
                            disabled={finalized}
                        />
                    </div>
                    <Checkbox
                        id="invalid"
                        label={t("label.question.form.invalid")}
                        checked={moreOptionValue.invalid}
                        onChange={handleInvalidChange}
                        className={{
                            root: inputStyles({
                                disabled:
                                    finalized || moreOptionValue.anweredTooSoon,
                            }),
                        }}
                    />
                    <Checkbox
                        id="too-soon"
                        label={t("label.question.form.tooSoon")}
                        checked={moreOptionValue.anweredTooSoon}
                        onChange={handleAnsweredTooSoonChange}
                        className={{
                            root: inputStyles({
                                disabled: finalized || moreOptionValue.invalid,
                            }),
                        }}
                    />
                    <Answer t={t} question={question} />
                </>
            ) : (
                <>
                    <Typography>{t("label.question.notOpen")}</Typography>
                    <div className="flex gap-2">
                        <Typography>{t("label.question.openingIn")}</Typography>
                        <Timer
                            icon={true}
                            to={question.openingTimestamp * 1_000}
                            countdown={true}
                        />
                    </div>
                </>
            )}
            {!finalized && (
                <Button
                    onClick={handleSubmit}
                    disabled={!postAnswerAsync}
                    loading={submitting}
                >
                    {t("label.question.form.confirm")}
                </Button>
            )}
        </div>
    );
};
