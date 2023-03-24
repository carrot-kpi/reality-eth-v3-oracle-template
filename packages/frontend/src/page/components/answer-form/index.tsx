import {
    NamespacedTranslateFunction,
    OraclePageProps,
    TxType,
} from "@carrot-kpi/react";
import {
    Button,
    Checkbox,
    Markdown,
    NumberInput,
    Typography,
    Radio,
    RadioGroup,
    Skeleton,
} from "@carrot-kpi/ui";
import { BigNumber, utils } from "ethers";
import {
    ChangeEvent,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    usePrepareContractWrite,
    useContractWrite,
    useNetwork,
    useContractRead,
} from "wagmi";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BooleanAnswer,
    INVALID_REALITY_ANSWER,
    SupportedRealityTemplates,
    TRUSTED_REALITY_ARBITRATORS,
} from "../../../commons";
import {
    formatCountDownString,
    formatRealityEthQuestionLink,
    isAnsweredTooSoon,
    isAnswerMissing,
    isAnswerPendingArbitration,
    isQuestionFinalized,
    numberToByte32,
    shortenAddress,
} from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "./answer";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3.json";
import REALITY_ORACLE_V3_ABI from "../../../abis/reality-oracle-v3.json";
import TRUSTED_REALITY_ARBITRATOR_V3_ABI from "../../../abis/trusted-reality-arbitrator-v3.json";
import { BondInput } from "./bond-input";
import dayjs from "dayjs";
import { infoPopoverStyles, inputStyles } from "./common/styles";
import { QuestionInfo } from "../question-info";
import { ReactComponent as ExternalSvg } from "../../../assets/external.svg";
import { OpeningCountdown } from "../opening-countdown";
import { ChainId, Oracle } from "@carrot-kpi/sdk";
import { unixTimestamp } from "../../../utils/dates";
import { useRealityQuestionResponses } from "../../../hooks/useRealityQuestionResponses";
import { useQuestionContent } from "../../../hooks/useQuestionContent";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityAddress: string;
    oracle: Oracle;
    question: RealityQuestion;
    loadingQuestion: boolean;
    onTx: OraclePageProps["onTx"];
}

export const AnswerForm = ({
    t,
    realityAddress,
    oracle,
    question,
    loadingQuestion,
    onTx,
}: AnswerFormProps): ReactElement => {
    const { loading: loadingAnswers, responses } = useRealityQuestionResponses(
        realityAddress,
        question.id
    );
    const { loading: loadingContent, content } = useQuestionContent(
        question.content
    );
    // TODO: remove this console log
    console.log({ loadingAnswers, responses });

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
    const [requestingArbitration, setRequestingArbitration] = useState(false);
    const [moreOptionValue, setMoreOptionValue] = useState({
        invalid: false,
        anweredTooSoon: false,
    });
    const [submitAnswerDisabled, setSubmitAnswerDisabled] = useState(true);
    const [bond, setBond] = useState<NumberFormatValue>({
        formattedValue: "",
        value: "",
    });
    const [bondErrorText, setBondErrorText] = useState("");

    const { chain } = useNetwork();

    const minimumBond = question.bond.isZero()
        ? question.minBond
        : question.bond.mul(2);

    const finalBond = useMemo(() => {
        return !!bond && !!bond.value
            ? utils.parseUnits(bond.value, chain?.nativeCurrency.decimals)
            : BigNumber.from("0");
    }, [bond, chain?.nativeCurrency.decimals]);

    const { data: disputeFee } = useContractRead({
        address:
            !!chain && chain.id
                ? TRUSTED_REALITY_ARBITRATORS[chain.id as ChainId]
                : "",
        abi: TRUSTED_REALITY_ARBITRATOR_V3_ABI,
        functionName: "getDisputeFee",
        enabled: !!chain && !!chain.id,
    });

    const { config: submitAnswerConfig } = usePrepareContractWrite({
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "submitAnswer",
        args: [question.id, answer, BigNumber.from(0)],
        overrides: {
            value: finalBond,
        },
        enabled: !!answer && !!finalBond && finalBond.gte(minimumBond),
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
        abi: REALITY_ORACLE_V3_ABI,
        functionName: "finalize",
        enabled: finalized && !oracle.finalized,
    });
    const { writeAsync: finalizeOracleAsync } =
        useContractWrite(finalizeOracleConfig);

    const { config: requestArbitrationConfig } = usePrepareContractWrite({
        address:
            !!chain && chain.id
                ? TRUSTED_REALITY_ARBITRATORS[chain.id as ChainId]
                : "",
        abi: TRUSTED_REALITY_ARBITRATOR_V3_ABI,
        functionName: "requestArbitration",
        args: [question.id, BigNumber.from(0)],
        overrides: {
            value: disputeFee ? BigNumber.from(disputeFee) : undefined,
        },
        enabled:
            !!chain &&
            !!chain.id &&
            !finalized &&
            !!disputeFee &&
            !isAnswerMissing(question),
    });
    const { writeAsync: requestArbitrationAsync } = useContractWrite(
        requestArbitrationConfig
    );

    useEffect(() => {
        setSubmitAnswerDisabled(
            !answer ||
                (!!finalBond && finalBond.lt(minimumBond)) ||
                !postAnswerAsync
        );
    }, [answer, finalBond, minimumBond, postAnswerAsync]);

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
        (value: NumberFormatValue) => {
            setBond(value);

            const parsedBond = utils.parseUnits(
                value.value || "0",
                chain?.nativeCurrency.decimals
            );
            setBondErrorText(
                !value || !value.value || parsedBond.isZero()
                    ? t("error.bond.empty")
                    : parsedBond.lt(minimumBond)
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
                const receipt = await tx.wait();

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.answerSubmitted", {
                            bond: utils.commify(
                                utils.formatUnits(BigNumber.from(finalBond), 18)
                            ),
                            symbol: chain?.nativeCurrency.symbol,
                        }),
                    },
                    receipt,
                    timestamp: unixTimestamp(new Date()),
                });
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
    }, [postAnswerAsync, onTx, t, finalBond, chain?.nativeCurrency.symbol]);

    const handleReopenSubmit = useCallback(() => {
        if (!reopenAnswerAsync) return;
        let cancelled = false;
        const submitReopen = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await reopenAnswerAsync();
                const receipt = await tx.wait();

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.reopenSubmitted"),
                    },
                    receipt,
                    timestamp: unixTimestamp(new Date()),
                });
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
    }, [reopenAnswerAsync, onTx, t]);

    const handleFinalizeOracleSubmit = useCallback(() => {
        if (!finalizeOracleAsync) return;
        let cancelled = false;
        const submitFinalizeOracle = async () => {
            if (!cancelled) setFinalizingOracle(true);
            try {
                const tx = await finalizeOracleAsync();
                const receipt = await tx.wait();

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.oracleFinalized"),
                    },
                    receipt,
                    timestamp: unixTimestamp(new Date()),
                });
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
    }, [finalizeOracleAsync, onTx, t]);

    const handleRequestArbitrationSubmit = useCallback(() => {
        if (!requestArbitrationAsync) return;
        let cancelled = false;
        const submitRequestArbitration = async () => {
            if (!cancelled) setRequestingArbitration(true);
            try {
                const tx = await requestArbitrationAsync();
                const receipt = await tx.wait();

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.arbitrationRequested"),
                    },
                    receipt,
                    timestamp: unixTimestamp(new Date()),
                });
                if (cancelled) return;
            } catch (error) {
                console.error("error requesting arbitration", error);
            } finally {
                if (!cancelled) setRequestingArbitration(false);
            }
        };
        void submitRequestArbitration();
        return () => {
            cancelled = true;
        };
    }, [requestArbitrationAsync, onTx, t]);

    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;
    const requestArbitrationDisabled =
        finalized ||
        !requestArbitrationAsync ||
        isAnswerMissing(question) ||
        isAnswerPendingArbitration(question);

    return (
        <div className="flex flex-col">
            <div className="min-h-[50px] max-h-[400px] overflow-y-auto">
                {loadingContent ? (
                    <Skeleton width="100px" />
                ) : (
                    <Markdown>{content}</Markdown>
                )}
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
            {!isAnswerPendingArbitration(question) && !finalized && (
                <Typography
                    variant="h5"
                    weight="bold"
                    className={{ root: "mt-12" }}
                >
                    {t("label.question.subtitle")}
                </Typography>
            )}
            {open && !isAnswerPendingArbitration(question) && !finalized && (
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
                                    inputWrapper: inputStyles({
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
                                    inputWrapper: inputStyles({
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
            {!isAnswerPendingArbitration(question) && (
                <>
                    {!finalized && (
                        <div className="flex flex-col md:flex-row gap-5 mt-5">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitAnswerDisabled}
                                loading={submitting || loadingQuestion}
                                size="small"
                            >
                                {t("label.question.form.confirm")}
                            </Button>
                            <Button
                                onClick={handleRequestArbitrationSubmit}
                                disabled={requestArbitrationDisabled}
                                loading={
                                    requestingArbitration || loadingQuestion
                                }
                                size="small"
                            >
                                {t("label.question.form.requestArbitration")}
                            </Button>
                        </div>
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
                </>
            )}
        </div>
    );
};
