import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
    Checkbox,
    Markdown,
    NumberInput,
    Typography,
    Radio,
    RadioGroup,
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
    isAnsweredTooSoon,
    isQuestionFinalized,
    numberToByte32,
    shortenAddress,
} from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "./answer";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3.json";
import { BondInput } from "./bond-input";
import dayjs from "dayjs";
import { infoPopoverStyles, inputStyles } from "./common/styles";
import { QuestionInfo } from "../question-info";
import { ReactComponent as ExternalSvg } from "../../../assets/external.svg";
import { OpeningCountdown } from "../opening-countdown";
import { Oracle, ORACLE_ABI } from "@carrot-kpi/sdk";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityAddress: string;
    oracle: Oracle;
    question: RealityQuestion;
    loadingQuestion: boolean;
}

export const AnswerForm = ({
    t,
    realityAddress,
    oracle,
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
    const [finalizingOracle, setFinalizingOracle] = useState(false);
    const [moreOptionValue, setMoreOptionValue] = useState({
        invalid: false,
        anweredTooSoon: false,
    });
    const [submitAnswerDisabled, setSubmitAnswerDisabled] = useState(true);

    const [bond, setBond] = useState<BigNumber | null>(null);
    const [bondErrorText, setBondErrorText] = useState("");

    const minimumBond = question.bond.isZero()
        ? question.minBond
        : question.bond.mul(2);

    const { chain } = useNetwork();
    const { config: submitAnswerConfig } = usePrepareContractWrite({
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "submitAnswer",
        args: [question.id, answer, BigNumber.from(0)],
        overrides: {
            value: bond || BigNumber.from(0),
        },
        enabled: !!answer && !!bond && bond.gte(minimumBond),
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
        enabled: finalized && isAnsweredTooSoon(question),
    });
    const { writeAsync: reopenAnswerAsync } =
        useContractWrite(reopenQuestionConfig);

    const { config: finalizeOracleConfig } = usePrepareContractWrite({
        address: oracle.address,
        abi: ORACLE_ABI,
        functionName: "finalize",
        enabled: finalized && !oracle.finalized,
    });
    const { writeAsync: finalizeOracleAsync } =
        useContractWrite(finalizeOracleConfig);

    useEffect(() => {
        setSubmitAnswerDisabled(
            !answer || (!!bond && bond.lt(minimumBond)) || !postAnswerAsync
        );
    }, [answer, bond, minimumBond, postAnswerAsync]);

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

    const handleBondChange = useCallback(
        (value: BigNumber | null) => {
            setBond(value);
            setBondErrorText(
                !value || BigNumber.from(value).isZero()
                    ? t("error.bond.empty")
                    : value.lt(minimumBond)
                    ? t("error.bond.insufficient", {
                          minBond: utils.formatUnits(
                              minimumBond,
                              chain?.nativeCurrency.decimals
                          ),
                      })
                    : ""
            );
        },
        [t, setBondErrorText, minimumBond, chain]
    );

    const handleSubmit = useCallback(() => {
        if (!postAnswerAsync) return;
        let cancelled = false;
        const submit = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await postAnswerAsync();
                await tx.wait();
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

    const handleFinalizeOracleSubmit = useCallback(() => {
        if (!finalizeOracleAsync) return;
        let cancelled = false;
        const submitFinalizeOracle = async () => {
            if (!cancelled) setFinalizingOracle(true);
            try {
                const tx = await finalizeOracleAsync();
                await tx.wait();
            } catch (error) {
                console.error("error finalizing oracle", error);
            } finally {
                if (!cancelled) setFinalizingOracle(false);
            }
        };
        void submitFinalizeOracle();
        return () => {
            cancelled = true;
        };
    }, [finalizeOracleAsync]);

    if (question.pendingArbitration) return <></>;

    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;

    return (
        <div className="flex flex-col">
            <div className="min-h-[50px] max-h-[400px] overflow-y-auto">
                <Markdown>{question.resolvedContent}</Markdown>
            </div>
            <div className="flex justify-between gap-4 mt-10">
                <QuestionInfo
                    label={t("label.question.arbitrator")}
                    className={{ root: "hidden lg:flex" }}
                >
                    {shortenAddress(question.arbitrator)}
                </QuestionInfo>
                <QuestionInfo
                    label={t("label.question.rewards")}
                    className={{ root: "hidden sm:flex" }}
                >
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
                    className={{ root: "hidden lg:flex" }}
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
            <div className="mt-6">
                <Answer
                    t={t}
                    question={question}
                    loadingQuestion={loadingQuestion}
                />
            </div>
            {!finalized && (
                <Typography
                    variant="h5"
                    weight="bold"
                    className={{ root: "mt-12" }}
                >
                    {t("label.question.subtitle")}
                </Typography>
            )}
            {open && !finalized && (
                <div className="flex flex-col gap-6 mt-6">
                    {question.templateId === SupportedRealityTemplates.BOOL && (
                        <RadioGroup
                            id="bool-template"
                            className={{
                                radioInputsWrapper:
                                    "flex flex-col gap-8 md:flex-row md:gap-11",
                            }}
                        >
                            <Radio
                                id="bool-template-yes"
                                name="bool-answer"
                                label={t("label.question.form.yes")}
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
                                label={t("label.question.form.no")}
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
                                label={t("label.question.form.invalid")}
                                info={
                                    <Typography variant="sm">
                                        {t("invalid.info")}
                                    </Typography>
                                }
                                value={BooleanAnswer.INVALID_REALITY_ANSWER}
                                checked={
                                    booleanValue ===
                                    BooleanAnswer.INVALID_REALITY_ANSWER
                                }
                                disabled={answerInputDisabled}
                                onChange={handleBooleanRadioChange}
                                className={{
                                    infoPopover: infoPopoverStyles(),
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                            <Radio
                                id="bool-template-too-soon"
                                name="bool-answer"
                                label={t("label.question.form.tooSoon")}
                                info={
                                    <Typography variant="sm">
                                        {t("tooSoon.info")}
                                    </Typography>
                                }
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
                                    infoPopover: infoPopoverStyles(),
                                    inputWrapper: inputStyles({
                                        disabled: answerInputDisabled,
                                    }),
                                }}
                            />
                        </RadioGroup>
                    )}
                    {question.templateId === SupportedRealityTemplates.UINT && (
                        <div className="flex flex-col lg:items-center lg:flex-row gap-8">
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
                                info={
                                    <Typography variant="sm">
                                        {t("invalid.info")}
                                    </Typography>
                                }
                                checked={moreOptionValue.invalid}
                                onChange={handleInvalidChange}
                                className={{
                                    infoPopover: infoPopoverStyles(),
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
                                info={
                                    <Typography variant="sm">
                                        {t("tooSoon.info")}
                                    </Typography>
                                }
                                checked={moreOptionValue.anweredTooSoon}
                                onChange={handleAnsweredTooSoonChange}
                                className={{
                                    infoPopover: infoPopoverStyles(),
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
                    <div className="mt-3">
                        <BondInput
                            t={t}
                            value={bond}
                            placeholder={utils.formatUnits(
                                minimumBond,
                                chain?.nativeCurrency.decimals
                            )}
                            errorText={bondErrorText}
                            onChange={handleBondChange}
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
            {!finalized && (
                <Button
                    onClick={handleSubmit}
                    disabled={submitAnswerDisabled}
                    loading={submitting || loadingQuestion}
                    size="small"
                    className={{ root: "mt-5" }}
                >
                    {t("label.question.form.confirm")}
                </Button>
            )}
            {finalized && isAnsweredTooSoon(question) && (
                <Button
                    onClick={handleReopenSubmit}
                    disabled={!reopenAnswerAsync}
                    loading={submitting || loadingQuestion}
                    size="small"
                    className={{ root: "mt-5" }}
                >
                    {t("label.question.form.reopen")}
                </Button>
            )}
            {finalized && !isAnsweredTooSoon(question) && (
                <Button
                    onClick={handleFinalizeOracleSubmit}
                    disabled={!finalizeOracleAsync || oracle.finalized}
                    loading={finalizingOracle || loadingQuestion}
                    size="small"
                    className={{ root: "mt-5" }}
                >
                    {t("label.question.form.finalize")}
                </Button>
            )}
        </div>
    );
};
