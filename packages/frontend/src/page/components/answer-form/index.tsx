import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
    Checkbox,
    Markdown,
    NumberInput,
    Typography,
    Radio,
    Skeleton,
} from "@carrot-kpi/ui";
import { BigNumber, utils } from "ethers";
import {
    ChangeEvent,
    ReactElement,
    useCallback,
    useEffect,
    useState,
} from "react";
import { usePrepareContractWrite, useContractWrite, useNetwork } from "wagmi";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BooleanAnswer,
    INVALID_REALITY_ANSWER,
    SupportedRealityTemplates,
} from "../../../commons";
import {
    formatCountDownString,
    formatRealityEthQuestionLink,
    isQuestionAnsweredTooSoon,
    isQuestionFinalized,
    numberToByte32,
    shortenAddress,
} from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "./answer";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3.json";
import { BondInput } from "./bond-input";
import dayjs from "dayjs";
import { inputStyles } from "./common/styles";
import { QuestionInfo } from "../question-info";
import { ReactComponent as ExternalSvg } from "../../../assets/external.svg";
import { OpeningCountdown } from "../opening-countdown";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityAddress: string;
    question: RealityQuestion;
    loadingQuestion: boolean;
}

export const AnswerForm = ({
    t,
    realityAddress,
    question,
    loadingQuestion,
}: AnswerFormProps): ReactElement => {
    const [open, setOpen] = useState(false);
    const [booleanValue, setBooleanValue] = useState<BooleanAnswer | null>(
        null
    );
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

    const { chain } = useNetwork();
    const { config: submitAnswerConfig, isFetching: isFetchingSubmitAnswer } =
        usePrepareContractWrite({
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
                    question.bond.isZero()
                        ? question.minBond
                        : question.bond.mul(2)
                ),
        });
    const { writeAsync: postAnswerAsync } =
        useContractWrite(submitAnswerConfig);

    const finalized = isQuestionFinalized(question);
    const { config: reopenQuestionConfig } = usePrepareContractWrite({
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "reopenQuestion",
        args: [
            question.templateId,
            question.content,
            question.arbitrator,
            question.timeout,
            question.openingTimestamp,
            question.id,
            question.minBond,
            question.reopenedId || question.id,
        ],
        enabled: finalized && isQuestionAnsweredTooSoon(question),
    });
    const { writeAsync: reopenAnswerAsync } =
        useContractWrite(reopenQuestionConfig);

    useEffect(() => {
        if (question.openingTimestamp < dayjs().unix()) {
            setOpen(true);
            return;
        }

        const interval = setInterval(() => {
            setOpen(question.openingTimestamp < dayjs().unix());
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [open, question.openingTimestamp]);

    useEffect(() => {
        if (moreOptionValue.anweredTooSoon)
            return setAnswer(ANSWERED_TOO_SOON_REALITY_ANSWER);
        if (moreOptionValue.invalid) return setAnswer(INVALID_REALITY_ANSWER);
        if (booleanValue) return setAnswer(numberToByte32(booleanValue));
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

    const handleBooleanRadioChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setBooleanValue(event.target.value as BooleanAnswer);
        },
        []
    );

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

    const handleReopenSubmit = useCallback(() => {
        if (!reopenAnswerAsync) return;
        let cancelled = false;
        const submitReopen = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await reopenAnswerAsync();
                await tx.wait();
                if (cancelled) return;
            } catch (error) {
                console.error(
                    "error submitting answer reopening to reality v3",
                    error
                );
            } finally {
                if (!cancelled) setSubmitting(false);
            }
        };
        void submitReopen();
        return () => {
            cancelled = true;
        };
    }, [reopenAnswerAsync]);

    if (question.pendingArbitration) return <></>;

    const minimumBond = question.bond.isZero()
        ? BigNumber.from(0)
        : question.bond.mul(2);
    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;

    return (
        <div className="flex flex-col">
            <Markdown>{question.resolvedContent}</Markdown>
            <div className="flex justify-between gap-3 mt-10">
                <QuestionInfo
                    label={t("label.question.arbitrator")}
                    className={{ root: "hidden md:flex" }}
                >
                    {shortenAddress(question.arbitrator)}
                </QuestionInfo>
                <QuestionInfo label={t("label.question.rewards")}>
                    {!question.bounty.isZero() && chain?.id ? (
                        <>{/* TODO: add rewards when implemented */}</>
                    ) : (
                        "-"
                    )}
                </QuestionInfo>
                <QuestionInfo label={t("label.question.timeout")}>
                    {formatCountDownString(question.timeout)}
                </QuestionInfo>
                <QuestionInfo
                    label={t("label.question.oracleLink")}
                    className={{ root: "hidden md:flex" }}
                >
                    <a
                        className="flex gap-1 items-center"
                        href={formatRealityEthQuestionLink(
                            question.id,
                            realityAddress
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Typography>Reality.eth</Typography>
                        <ExternalSvg className="w-6 h-6 cursor-pointer" />
                    </a>
                </QuestionInfo>
            </div>
            {open && !finalized && (
                <div className="flex flex-col gap-6 mt-10">
                    <Typography variant="h5" weight="bold">
                        {t("label.question.subtitle")}
                    </Typography>
                    {question.templateId === SupportedRealityTemplates.BOOL && (
                        <div className="flex flex-col md:flex-row gap-8">
                            <Radio
                                id="bool-template-yes"
                                name="bool-answer"
                                label="Yes"
                                value={BooleanAnswer.YES}
                                checked={booleanValue === BooleanAnswer.YES}
                                disabled={answerInputDisabled}
                                onChange={handleBooleanRadioChange}
                                className={{
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                            <Radio
                                id="bool-template-no"
                                name="bool-answer"
                                label="No"
                                value={BooleanAnswer.NO}
                                checked={booleanValue === BooleanAnswer.NO}
                                disabled={answerInputDisabled}
                                onChange={handleBooleanRadioChange}
                                className={{
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                            <Radio
                                id="bool-template-invalid"
                                name="bool-answer"
                                label="Invalid question"
                                value={BooleanAnswer.INVALID_REALITY_ANSWER}
                                checked={
                                    booleanValue ===
                                    BooleanAnswer.INVALID_REALITY_ANSWER
                                }
                                disabled={answerInputDisabled}
                                onChange={handleBooleanRadioChange}
                                className={{
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                            <Radio
                                id="bool-template-too-soon"
                                name="bool-answer"
                                label="Answered too soon"
                                value={
                                    BooleanAnswer.ANSWERED_TOO_SOON_REALITY_ANSWER
                                }
                                checked={
                                    booleanValue ===
                                    BooleanAnswer.ANSWERED_TOO_SOON_REALITY_ANSWER
                                }
                                disabled={answerInputDisabled}
                                onChange={handleBooleanRadioChange}
                                className={{
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                        </div>
                    )}
                    {question.templateId === SupportedRealityTemplates.UINT && (
                        <div className="flex flex-col md:items-center md:flex-row gap-8">
                            <NumberInput
                                id="uint-template"
                                placeholder={"0.0"}
                                allowNegative={false}
                                min={0}
                                value={numberValue.formattedValue}
                                disabled={answerInputDisabled}
                                onValueChange={setNumberValue}
                                className={{
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                            <Checkbox
                                id="invalid"
                                label={t("label.question.form.invalid")}
                                checked={moreOptionValue.invalid}
                                onChange={handleInvalidChange}
                                className={{
                                    root: inputStyles({
                                        disabled:
                                            finalized ||
                                            moreOptionValue.anweredTooSoon,
                                        full: false,
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
                                        disabled:
                                            finalized ||
                                            moreOptionValue.invalid,
                                        full: false,
                                    }),
                                }}
                            />
                        </div>
                    )}
                    <div className="mt-4">
                        <BondInput
                            t={t}
                            value={minimumBond || bond}
                            onChange={setBond}
                            disabled={finalized}
                        />
                    </div>
                </div>
            )}
            {!open && (
                <div className="flex flex-col gap-2 mt-10">
                    <Typography>{t("label.question.timeLeft")}</Typography>
                    <OpeningCountdown
                        t={t}
                        to={question.openingTimestamp}
                        countdown={true}
                    />
                </div>
            )}
            <div className="mt-10">
                {loadingQuestion ? (
                    <Skeleton width="100%" height="48px" />
                ) : (
                    <Answer t={t} question={question} />
                )}
            </div>
            <div className="flex gap-6 mt-5">
                {!finalized && (
                    <Button
                        onClick={handleSubmit}
                        disabled={!postAnswerAsync || loadingQuestion}
                        loading={submitting || isFetchingSubmitAnswer}
                        size="small"
                    >
                        {t("label.question.form.confirm")}
                    </Button>
                )}
                {finalized && isQuestionAnsweredTooSoon(question) && (
                    <Button
                        onClick={handleReopenSubmit}
                        disabled={!reopenAnswerAsync}
                        loading={submitting}
                        size="small"
                    >
                        {t("label.question.form.reopen")}
                    </Button>
                )}
            </div>
        </div>
    );
};
