import {
    type NamespacedTranslateFunction,
    type OraclePageProps,
    TxType,
    useNativeCurrency,
} from "@carrot-kpi/react";
import {
    Button,
    Markdown,
    Typography,
    Skeleton,
    Popover,
} from "@carrot-kpi/ui";
import {
    type ChangeEvent,
    type ReactElement,
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
    useAccount,
    useBalance,
    usePublicClient,
} from "wagmi";
import {
    bytesToHex,
    formatUnits,
    isHex,
    numberToHex,
    parseUnits,
    toBytes,
    zeroAddress,
} from "viem";
import type { Hex, Hash, Address } from "viem";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BooleanAnswer,
    BYTES32_ZERO,
    INVALID_REALITY_ANSWER,
    SupportedChainId,
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
} from "../../../utils";
import type { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "./answer";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3";
import REALITY_ORACLE_V3_ABI from "../../../abis/reality-oracle-v3";
import TRUSTED_REALITY_ARBITRATOR_V3_ABI from "../../../abis/trusted-reality-arbitrator-v3";
import { BondInput } from "./bond-input";
import dayjs from "dayjs";
import { QuestionInfo } from "../question-info";
import External from "../../../assets/external";
import { OpeningCountdown } from "../opening-countdown";
import {
    ResolvedKPITokenWithData,
    ResolvedOracleWithData,
} from "@carrot-kpi/sdk";
import { unixTimestamp } from "../../../utils/dates";
import { useQuestionContent } from "../../../hooks/useQuestionContent";
import { Arbitrator } from "./arbitrator";
import Danger from "../../../assets/danger";
import { useRealityClaimableHistory } from "../../../hooks/useRealityClaimableHistory";
import { useArbitratorFees } from "../../../hooks/useAbritratorFees";
import { useIsAnswerer } from "../../../hooks/useIsAnswerer";
import { BooleanInputs } from "./boolean-inputs";
import { ScalarInputs } from "./scalar-inputs";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    realityAddress: Address;
    oracle: ResolvedOracleWithData;
    kpiToken: ResolvedKPITokenWithData;
    question: RealityQuestion;
    loadingQuestion: boolean;
    onTx: OraclePageProps["onTx"];
}

export const AnswerForm = ({
    t,
    realityAddress,
    oracle,
    kpiToken,
    question,
    loadingQuestion,
    onTx,
}: AnswerFormProps): ReactElement => {
    const publicClient = usePublicClient();
    const { chain } = useNetwork();
    const nativeCurrency = useNativeCurrency();
    const { address: connectedAddress } = useAccount();
    const { data: userNativeCurrencyBalance } = useBalance({
        address: connectedAddress,
    });
    const finalized = isQuestionFinalized(question);
    const { loading: loadingClaimableHistory, claimable } =
        useRealityClaimableHistory(realityAddress, question.id, finalized);
    const { loading: loadingContent, content } = useQuestionContent(
        question.content,
    );
    const { loading: loadingAnswerer, answerer } = useIsAnswerer(
        realityAddress,
        question.id,
        connectedAddress,
        finalized,
    );

    const [open, setOpen] = useState(false);
    const [disputeFeePopoverAnchor, setDisputeFeePopoverAnchor] =
        useState<HTMLButtonElement | null>(null);
    const [disputeFeePopoverOpen, setDisputeFeePopoverOpen] = useState(false);
    const [booleanValue, setBooleanValue] = useState<BooleanAnswer | null>(
        null,
    );
    const [numberValue, setNumberValue] = useState<NumberFormatValue>({
        formattedValue: "",
        value: "",
    });
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [finalizingOracle, setFinalizingOracle] = useState(false);
    const [requestingArbitration, setRequestingArbitration] = useState(false);
    const [claimingAndWithdrawing, setClaimingAndWithdrawing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);
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

    const minimumBond =
        question.bond === 0n ? question.minBond : question.bond * 2n;

    const finalBond = useMemo(() => {
        return !!bond && !!bond.value && !isNaN(parseInt(bond.value))
            ? parseUnits(bond.value as `${number}`, nativeCurrency.decimals)
            : 0n;
    }, [bond, nativeCurrency.decimals]);

    const claimWinningsPayload = useMemo(() => {
        const payload = Object.keys(claimable).reduce(
            (
                accumulator: {
                    [key: string]: {
                        historyHashes: Hash[];
                        answerers: Address[];
                        bonds: bigint[];
                        responses: Hex[];
                    };
                },
                questionId,
            ) => {
                if (!accumulator[questionId]) {
                    accumulator[questionId] = {
                        historyHashes: [],
                        answerers: [],
                        bonds: [],
                        responses: [],
                    };
                }

                accumulator[questionId].historyHashes.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.hash,
                    ),
                );
                accumulator[questionId].answerers.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.answerer,
                    ),
                );
                accumulator[questionId].bonds.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.bond,
                    ),
                );
                accumulator[questionId].responses.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.answer,
                    ),
                );

                return accumulator;
            },
            {},
        );

        const mergedPayload = Object.keys(payload).reduce(
            (
                accumulator: {
                    historyLengths: bigint[];
                    historyHashes: Hash[];
                    answerers: Address[];
                    bonds: bigint[];
                    responses: Hex[];
                },
                questionId,
            ) => {
                // the last history hash must be empty
                payload[questionId].historyHashes.reverse().shift();
                payload[questionId].historyHashes.push(BYTES32_ZERO);
                payload[questionId].answerers.reverse();
                payload[questionId].bonds.reverse();
                payload[questionId].responses.reverse();

                accumulator.historyLengths.push(
                    BigInt(payload[questionId].historyHashes.length),
                );
                accumulator.historyHashes.push(
                    ...payload[questionId].historyHashes,
                );
                accumulator.answerers.push(...payload[questionId].answerers);
                accumulator.bonds.push(...payload[questionId].bonds);
                accumulator.responses.push(...payload[questionId].responses);

                return accumulator;
            },
            {
                historyLengths: [],
                historyHashes: [],
                answerers: [],
                bonds: [],
                responses: [],
            },
        );

        return mergedPayload;
    }, [claimable]);

    const arbitratorAddress = useMemo(
        () =>
            !!chain && chain.id && chain.id in SupportedChainId
                ? (TRUSTED_REALITY_ARBITRATORS[chain.id as SupportedChainId] as
                      | Address
                      | undefined)
                : undefined,
        [chain],
    );

    const { fees } = useArbitratorFees(arbitratorAddress);

    const { data: withdrawableBalance, isLoading: loadingWithdrawableBalance } =
        useContractRead({
            chainId: chain?.id,
            address: realityAddress,
            abi: REALITY_ETH_V3_ABI,
            functionName: "balanceOf",
            args: connectedAddress && [connectedAddress],
            enabled: !!chain?.id && !!connectedAddress && finalized,
            watch: true,
        });

    const { config: submitAnswerConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "submitAnswer",
        args: [question.id, answer as Hex, 0n],
        value: finalBond,
        enabled:
            !!chain?.id && !!answer && !!finalBond && finalBond >= minimumBond,
    });
    const { writeAsync: postAnswerAsync } =
        useContractWrite(submitAnswerConfig);

    const { config: reopenQuestionConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "reopenQuestion",
        args: [
            BigInt(question.templateId),
            question.content,
            question.arbitrator,
            question.timeout,
            question.openingTimestamp,
            BigInt(question.id),
            question.minBond,
            question.reopenedId || question.id,
        ],
        value: fees?.question || 0n,
        enabled:
            !!fees && !!chain?.id && finalized && isAnsweredTooSoon(question),
    });
    const { writeAsync: reopenAnswerAsync } =
        useContractWrite(reopenQuestionConfig);

    const { config: finalizeOracleConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: oracle.address,
        abi: REALITY_ORACLE_V3_ABI,
        functionName: "finalize",
        enabled:
            !!chain?.id &&
            finalized &&
            !oracle.finalized &&
            !isAnsweredTooSoon(question),
    });
    const { writeAsync: finalizeOracleAsync } =
        useContractWrite(finalizeOracleConfig);

    const { config: requestArbitrationConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address:
            !!chain && chain.id && chain.id in SupportedChainId
                ? TRUSTED_REALITY_ARBITRATORS[chain.id as SupportedChainId]
                : undefined,
        abi: TRUSTED_REALITY_ARBITRATOR_V3_ABI,
        functionName: "requestArbitration",
        args: [question.id, 0n],
        value: fees?.dispute || 0n,
        enabled:
            !!fees &&
            !!chain &&
            !!chain.id &&
            !finalized &&
            !isAnswerPendingArbitration(question) &&
            !isAnswerMissing(question),
    });
    const { writeAsync: requestArbitrationAsync } = useContractWrite(
        requestArbitrationConfig,
    );

    const { config: claimMultipleAndWithdrawConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "claimMultipleAndWithdrawBalance",
        args: [
            Object.keys(claimable) as Hex[],
            claimWinningsPayload.historyLengths,
            claimWinningsPayload.historyHashes,
            claimWinningsPayload.answerers,
            claimWinningsPayload.bonds,
            claimWinningsPayload.responses,
        ],
        enabled:
            !!chain?.id &&
            !!question.id &&
            Object.keys(claimable).length > 0 &&
            finalized &&
            !loadingClaimableHistory &&
            !!claimWinningsPayload &&
            claimWinningsPayload.historyHashes.length > 0 &&
            claimWinningsPayload.answerers.length > 0 &&
            claimWinningsPayload.bonds.length > 0 &&
            claimWinningsPayload.responses.length > 0 &&
            question.historyHash !== BYTES32_ZERO &&
            !isAnswerMissing(question),
    });
    const { writeAsync: claimMultipleAndWithdrawAsync } = useContractWrite(
        claimMultipleAndWithdrawConfig,
    );

    const { config: withdrawConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "withdraw",
        enabled:
            !!chain?.id &&
            finalized &&
            !!withdrawableBalance &&
            withdrawableBalance > 0n,
    });
    const { writeAsync: withdrawAsync } = useContractWrite(withdrawConfig);

    useEffect(() => {
        setSubmitAnswerDisabled(
            !answer ||
                (!!finalBond && finalBond < minimumBond) ||
                !postAnswerAsync,
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
        if (booleanValue)
            return setAnswer(
                isHex(booleanValue)
                    ? booleanValue
                    : numberToHex(Number(booleanValue), { size: 32 }),
            );
        if (!isNaN(parseFloat(numberValue.value)))
            return setAnswer(
                bytesToHex(
                    toBytes(parseUnits(numberValue.value as `${number}`, 18), {
                        size: 32,
                    }),
                ),
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
        [],
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

            const parsedBond = parseUnits(
                value.value && !isNaN(parseInt(value.value))
                    ? (value.value as `${number}`)
                    : ("0" as `${number}`),
                nativeCurrency.decimals,
            );
            let bondErrorText = "";
            if (!value || !value.value || parsedBond === 0n)
                bondErrorText = t("error.bond.empty");
            else if (
                userNativeCurrencyBalance &&
                parsedBond > userNativeCurrencyBalance.value
            )
                bondErrorText = t("error.bond.notEnoughBalanceInWallet", {
                    symbol: nativeCurrency.symbol,
                });
            else if (parsedBond < minimumBond)
                bondErrorText = t("error.bond.insufficient", {
                    minBond: formatUnits(minimumBond, nativeCurrency.decimals),
                    symbol: nativeCurrency.symbol,
                });
            setBondErrorText(bondErrorText);
        },
        [
            nativeCurrency.decimals,
            nativeCurrency.symbol,
            t,
            userNativeCurrencyBalance,
            minimumBond,
        ],
    );

    const handleSubmit = useCallback(() => {
        if (!postAnswerAsync) return;
        let cancelled = false;
        const submit = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await postAnswerAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });
                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.answerSubmitted", {
                            /* FIXME: reintroduce commify to make number easier to read */
                            bond: formatUnits(finalBond, 18),
                            symbol: chain?.nativeCurrency.symbol,
                        }),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
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
    }, [
        postAnswerAsync,
        onTx,
        t,
        finalBond,
        chain?.nativeCurrency.symbol,
        publicClient,
    ]);

    const handleReopenSubmit = useCallback(() => {
        if (!reopenAnswerAsync) return;
        let cancelled = false;
        const submitReopen = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await reopenAnswerAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.reopenSubmitted"),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
                    timestamp: unixTimestamp(new Date()),
                });
            } catch (error) {
                console.error(
                    "error submitting answer reopening to reality v3",
                    error,
                );
            } finally {
                if (!cancelled) setSubmitting(false);
            }
        };
        void submitReopen();
        return () => {
            cancelled = true;
        };
    }, [reopenAnswerAsync, onTx, t, publicClient]);

    const handleFinalizeOracleSubmit = useCallback(() => {
        if (!finalizeOracleAsync) return;
        let cancelled = false;
        const submitFinalizeOracle = async () => {
            if (!cancelled) setFinalizingOracle(true);
            try {
                const tx = await finalizeOracleAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.oracleFinalized"),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
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
    }, [finalizeOracleAsync, onTx, t, publicClient]);

    const handleRequestArbitrationSubmit = useCallback(() => {
        if (!requestArbitrationAsync) return;
        let cancelled = false;
        const submitRequestArbitration = async () => {
            if (!cancelled) setRequestingArbitration(true);
            try {
                const tx = await requestArbitrationAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.arbitrationRequested"),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
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
    }, [requestArbitrationAsync, onTx, t, publicClient]);

    const handleClaimMultipleAndWithdrawSubmit = useCallback(() => {
        if (!claimMultipleAndWithdrawAsync) return;
        let cancelled = false;
        const submitClaimMultipleAndWithdraw = async () => {
            if (!cancelled) setClaimingAndWithdrawing(true);
            try {
                const tx = await claimMultipleAndWithdrawAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.winningsWithdrawn"),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
                    timestamp: unixTimestamp(new Date()),
                });
                if (cancelled) return;
            } catch (error) {
                console.error("error claiming winnings", error);
            } finally {
                if (!cancelled) setClaimingAndWithdrawing(false);
            }
        };
        void submitClaimMultipleAndWithdraw();
        return () => {
            cancelled = true;
        };
    }, [claimMultipleAndWithdrawAsync, onTx, t, publicClient]);

    const handleWithdrawSubmit = useCallback(() => {
        if (!withdrawAsync) return;
        let cancelled = false;
        const submitWithdraw = async () => {
            if (!cancelled) setWithdrawing(true);
            try {
                const tx = await withdrawAsync();
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: tx.hash,
                });

                onTx({
                    type: TxType.CUSTOM,
                    from: receipt.from,
                    hash: tx.hash,
                    payload: {
                        summary: t("label.transaction.winningsWithdrawn"),
                    },
                    receipt: {
                        from: receipt.from,
                        transactionIndex: receipt.transactionIndex,
                        blockHash: receipt.blockHash,
                        transactionHash: receipt.transactionHash,
                        to: receipt.to || zeroAddress,
                        contractAddress: receipt.contractAddress || zeroAddress,
                        blockNumber: Number(receipt.blockNumber),
                        status: receipt.status === "success" ? 1 : 0,
                    },
                    timestamp: unixTimestamp(new Date()),
                });
                if (cancelled) return;
            } catch (error) {
                console.error("error claiming winnings", error);
            } finally {
                if (!cancelled) setWithdrawing(false);
            }
        };
        void submitWithdraw();
        return () => {
            cancelled = true;
        };
    }, [withdrawAsync, onTx, t, publicClient]);

    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;
    const requestArbitrationDisabled =
        finalized ||
        !requestArbitrationAsync ||
        isAnswerMissing(question) ||
        isAnswerPendingArbitration(question);
    const claimAndWithdrawVisible =
        connectedAddress &&
        answerer &&
        withdrawableBalance !== undefined &&
        withdrawableBalance === 0n &&
        question.historyHash !== BYTES32_ZERO;
    const withdrawVisible =
        connectedAddress &&
        withdrawableBalance !== undefined &&
        withdrawableBalance > 0n;
    const formInputsVisible =
        open &&
        connectedAddress &&
        !isAnswerPendingArbitration(question) &&
        !finalized;

    const handleRequestArbitrationMouseEnter = useCallback(() => {
        if (requestArbitrationDisabled) return;
        setDisputeFeePopoverOpen(true);
    }, [requestArbitrationDisabled]);

    const handleRequestArbitrationMouseLeave = useCallback(() => {
        setDisputeFeePopoverOpen(false);
    }, []);

    return (
        <div className="flex flex-col">
            {kpiToken.expired && !oracle.finalized && (
                <div className="p-6 flex gap-3 items-center border-b border-black bg-orange/40 dark:border-white">
                    <Danger width={36} height={36} />
                    <Typography>{t("label.question.kpiExpired")}</Typography>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between">
                <div className="w-full flex border-b border-black dark:border-white">
                    <QuestionInfo
                        label={t("label.question.arbitrator")}
                        className={{
                            root: "border-r-0 md:border-r border-black dark:border-white",
                        }}
                    >
                        <Arbitrator address={question.arbitrator} />
                    </QuestionInfo>
                    {/* TODO: add rewards when implemented */}
                    {/* <QuestionInfo
                        label={t("label.question.rewards")}
                        className={{
                            root: "border-r-0 md:border-r dark:border-white",
                        }}
                    >
                        {!question.bounty.isZero() && chain?.id ? <></> : "-"}
                    </QuestionInfo> */}
                </div>
                <div className="w-full flex border-b border-black dark:border-white">
                    <QuestionInfo
                        label={t("label.question.timeout")}
                        className={{
                            root: "border-r-0 md:border-r border-black dark:border-white",
                        }}
                    >
                        <Typography>
                            {formatCountDownString(question.timeout)}
                        </Typography>
                    </QuestionInfo>
                </div>
                <div className="w-full flex border-b border-black dark:border-white">
                    <QuestionInfo
                        label={t("label.question.oracleLink")}
                        className={{
                            root: "border-r-0 border-black dark:border-white",
                        }}
                    >
                        <a
                            className="flex gap-1 items-center"
                            href={formatRealityEthQuestionLink(
                                question.id,
                                realityAddress,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Typography>Reality.eth</Typography>
                            <External className="w-4 h-4 cursor-pointer" />
                        </a>
                    </QuestionInfo>
                </div>
            </div>
            {open && (
                <Answer
                    t={t}
                    question={question}
                    loadingQuestion={loadingQuestion}
                />
            )}
            <div>
                <QuestionInfo
                    label={t("label.question.question")}
                    className={{
                        root: "border-r-0 border-black dark:border-white",
                    }}
                >
                    {loadingContent ? (
                        <Skeleton width="100px" />
                    ) : (
                        <Markdown
                            className={{ root: "font-medium overflow-x-auto" }}
                        >
                            {content}
                        </Markdown>
                    )}
                </QuestionInfo>
            </div>
            {!finalized && open && connectedAddress && (
                <Typography className={{ root: "px-6 mt-6" }}>
                    {isAnswerPendingArbitration(question) ? (
                        t("label.question.arbitrating.subtitle")
                    ) : (
                        <>
                            {t("label.question.subtitle.1")}
                            <a
                                className="text-orange underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://reality.eth.limo/app/docs/html/index.html"
                            >
                                {t("label.question.subtitle.2")}
                            </a>
                            .
                        </>
                    )}
                </Typography>
            )}
            {!open && (
                <div className="px-6 pt-6 flex flex-col gap-5 mb-6 border-t border-black dark:border-white">
                    <Typography>{t("label.question.timeLeft")}</Typography>
                    <OpeningCountdown
                        t={t}
                        to={question.openingTimestamp}
                        countdown={true}
                    />
                </div>
            )}
            {!connectedAddress && (
                <div className="flex p-6 h-60 items-center justify-center w-full border-t border-black dark:border-white bg-gray-200 dark:bg-black">
                    <Typography uppercase>
                        {t("label.answer.form.noWallet")}
                    </Typography>
                </div>
            )}
            {formInputsVisible && (
                <div className="px-6 flex flex-col gap-4 mt-6">
                    {question.templateId === SupportedRealityTemplates.BOOL && (
                        <BooleanInputs
                            t={t}
                            answer={booleanValue}
                            disabled={answerInputDisabled}
                            onChange={handleBooleanRadioChange}
                        />
                    )}
                    {question.templateId === SupportedRealityTemplates.UINT && (
                        <ScalarInputs
                            t={t}
                            scalarAnswer={numberValue}
                            scalarDisabled={answerInputDisabled}
                            onScalarAnswerChange={setNumberValue}
                            moreOptionsAnswer={moreOptionValue}
                            onAnsweredTooSoonChange={
                                handleAnsweredTooSoonChange
                            }
                            onInvalidChange={handleInvalidChange}
                        />
                    )}
                    <BondInput
                        t={t}
                        value={bond}
                        placeholder={formatUnits(
                            minimumBond,
                            nativeCurrency.decimals,
                        )}
                        errorText={bondErrorText}
                        onChange={handleBondChange}
                        disabled={finalized}
                    />
                </div>
            )}
            {open &&
            connectedAddress &&
            !isAnswerPendingArbitration(question) &&
            !finalized ? (
                <div className="px-6 flex flex-col md:flex-row gap-5 mt-6 mb-6">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitAnswerDisabled}
                        loading={submitting}
                        size="small"
                    >
                        {t("label.question.form.confirm")}
                    </Button>
                    <Button
                        onClick={handleRequestArbitrationSubmit}
                        onMouseEnter={handleRequestArbitrationMouseEnter}
                        onMouseLeave={handleRequestArbitrationMouseLeave}
                        disabled={requestArbitrationDisabled}
                        loading={requestingArbitration}
                        size="small"
                        ref={setDisputeFeePopoverAnchor}
                    >
                        {t("label.question.form.requestArbitration")}
                    </Button>
                    {!!fees && fees.dispute !== 0n && (
                        <Popover
                            anchor={disputeFeePopoverAnchor}
                            open={disputeFeePopoverOpen}
                            className={{ root: "px-3 py-2" }}
                        >
                            <Typography variant="sm">
                                {t("label.question.arbitrator.disputeFee", {
                                    /* FIXME: reintroduce commify to make number easier to read */
                                    fee: formatUnits(
                                        fees.dispute,
                                        nativeCurrency.decimals,
                                    ),
                                    symbol: chain?.nativeCurrency.symbol,
                                })}
                            </Typography>
                        </Popover>
                    )}
                </div>
            ) : open && connectedAddress ? (
                <div className="px-6 flex flex-col md:flex-row gap-5 mt-6 mb-6">
                    {isAnsweredTooSoon(question) && (
                        <Button
                            onClick={handleReopenSubmit}
                            disabled={!reopenAnswerAsync}
                            loading={submitting}
                            size="small"
                        >
                            {t("label.question.form.reopen")}
                        </Button>
                    )}
                    {!isAnsweredTooSoon(question) && (
                        <Button
                            onClick={handleFinalizeOracleSubmit}
                            disabled={!finalizeOracleAsync || oracle.finalized}
                            loading={finalizingOracle}
                            size="small"
                        >
                            {t("label.question.form.finalize")}
                        </Button>
                    )}
                    {claimAndWithdrawVisible && (
                        <Button
                            onClick={handleClaimMultipleAndWithdrawSubmit}
                            disabled={
                                !answerer ||
                                !claimMultipleAndWithdrawAsync ||
                                question.historyHash === BYTES32_ZERO
                            }
                            loading={
                                loadingAnswerer ||
                                loadingClaimableHistory ||
                                claimingAndWithdrawing
                            }
                            size="small"
                        >
                            {t("label.question.form.claimAndwithdrawWinnings")}
                        </Button>
                    )}
                    {withdrawVisible && (
                        <Button
                            onClick={handleWithdrawSubmit}
                            disabled={
                                !answerer ||
                                !withdrawAsync ||
                                withdrawableBalance === 0n
                            }
                            loading={
                                loadingAnswerer ||
                                loadingWithdrawableBalance ||
                                withdrawing
                            }
                            size="small"
                        >
                            {t("label.question.form.withdrawWinnings")}
                        </Button>
                    )}
                </div>
            ) : null}
        </div>
    );
};
