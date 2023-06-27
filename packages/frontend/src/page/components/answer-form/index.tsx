import {
    TxType,
    useNativeCurrency,
    type OraclePageProps,
} from "@carrot-kpi/react";
import {
    ResolvedKPITokenWithData,
    ResolvedOracleWithData,
} from "@carrot-kpi/sdk";
import {
    Button,
    Checkbox,
    Markdown,
    NumberInput,
    Popover,
    Radio,
    RadioGroup,
    Skeleton,
    Typography,
} from "@carrot-kpi/ui";
import dayjs from "dayjs";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type ReactElement,
} from "react";
import type { Address, Hash, Hex } from "viem";
import {
    bytesToHex,
    formatUnits,
    isHex,
    numberToHex,
    parseUnits,
    toBytes,
    zeroAddress,
} from "viem";
import {
    useAccount,
    useBalance,
    useContractRead,
    useContractWrite,
    useNetwork,
    usePrepareContractWrite,
    usePublicClient,
} from "wagmi";
import REALITY_ETH_V3_ABI from "../../../abis/reality-eth-v3";
import REALITY_ORACLE_V3_ABI from "../../../abis/reality-oracle-v3";
import TRUSTED_REALITY_ARBITRATOR_V3_ABI from "../../../abis/trusted-reality-arbitrator-v3";
import Danger from "../../../assets/danger";
import External from "../../../assets/external";
import {
    ANSWERED_TOO_SOON_REALITY_ANSWER,
    BYTES32_ZERO,
    BooleanAnswer,
    INVALID_REALITY_ANSWER,
    SupportedChainId,
    SupportedRealityTemplates,
    TRUSTED_REALITY_ARBITRATORS,
} from "../../../commons";
import { useArbitratorFees } from "../../../hooks/useAbritratorFees";
import { useIsAnswerer } from "../../../hooks/useIsAnswerer";
import { useQuestionContent } from "../../../hooks/useQuestionContent";
import { useRealityClaimableHistory } from "../../../hooks/useRealityClaimableHistory";
import {
    formatCountDownString,
    formatRealityEthQuestionLink,
    isAnswerMissing,
    isAnswerPendingArbitration,
    isAnsweredTooSoon,
    isQuestionFinalized,
} from "../../../utils";
import { unixTimestamp } from "../../../utils/dates";
import type { NumberFormatValue, RealityQuestion } from "../../types";
import { OpeningCountdown } from "../opening-countdown";
import { QuestionInfo } from "../question-info";
import { Answer } from "./answer";
import { Arbitrator } from "./arbitrator";
import { BondInput } from "./bond-input";
import { infoPopoverStyles, inputStyles } from "./common/styles";

interface AnswerFormProps {
    realityAddress: Address;
    oracle: ResolvedOracleWithData;
    kpiToken: ResolvedKPITokenWithData;
    question: RealityQuestion;
    loadingQuestion: boolean;
    onTx: OraclePageProps["onTx"];
}

export const AnswerForm = ({
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
        question.content
    );
    const { loading: loadingAnswerer, answerer } = useIsAnswerer(
        realityAddress,
        question.id,
        connectedAddress,
        finalized
    );

    const [open, setOpen] = useState(false);
    const [disputeFeePopoverAnchor, setDisputeFeePopoverAnchor] =
        useState<HTMLButtonElement | null>(null);
    const [disputeFeePopoverOpen, setDisputeFeePopoverOpen] = useState(false);
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
                questionId
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
                    ...claimable[questionId as Hex].map((answer) => answer.hash)
                );
                accumulator[questionId].answerers.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.answerer
                    )
                );
                accumulator[questionId].bonds.push(
                    ...claimable[questionId as Hex].map((answer) => answer.bond)
                );
                accumulator[questionId].responses.push(
                    ...claimable[questionId as Hex].map(
                        (answer) => answer.answer
                    )
                );

                return accumulator;
            },
            {}
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
                questionId
            ) => {
                // the last history hash must be empty
                payload[questionId].historyHashes.reverse().shift();
                payload[questionId].historyHashes.push(BYTES32_ZERO);
                payload[questionId].answerers.reverse();
                payload[questionId].bonds.reverse();
                payload[questionId].responses.reverse();

                accumulator.historyLengths.push(
                    BigInt(payload[questionId].historyHashes.length)
                );
                accumulator.historyHashes.push(
                    ...payload[questionId].historyHashes
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
            }
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
        [chain]
    );

    const { fees } = useArbitratorFees(arbitratorAddress);

    const { data: withdrawableBalance, isLoading: loadingWithdrawableBalance } =
        useContractRead({
            address: realityAddress,
            abi: REALITY_ETH_V3_ABI,
            functionName: "balanceOf",
            args: connectedAddress && [connectedAddress],
            enabled: !!connectedAddress,
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
        requestArbitrationConfig
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
        claimMultipleAndWithdrawConfig
    );

    const { config: withdrawConfig } = usePrepareContractWrite({
        chainId: chain?.id,
        address: realityAddress,
        abi: REALITY_ETH_V3_ABI,
        functionName: "withdraw",
        enabled: finalized && !!withdrawableBalance && withdrawableBalance > 0n,
    });
    const { writeAsync: withdrawAsync } = useContractWrite(withdrawConfig);

    useEffect(() => {
        setSubmitAnswerDisabled(
            !answer ||
                (!!finalBond && finalBond < minimumBond) ||
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
        if (booleanValue)
            return setAnswer(
                isHex(booleanValue)
                    ? booleanValue
                    : numberToHex(Number(booleanValue), { size: 32 })
            );
        if (!isNaN(parseFloat(numberValue.value)))
            return setAnswer(
                bytesToHex(
                    toBytes(parseUnits(numberValue.value as `${number}`, 18), {
                        size: 32,
                    })
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

            const parsedBond = parseUnits(
                value.value && !isNaN(parseInt(value.value))
                    ? (value.value as `${number}`)
                    : ("0" as `${number}`),
                nativeCurrency.decimals
            );
            let bondErrorText = "";
            if (!value || !value.value || parsedBond === 0n)
                bondErrorText = "Test";
            else if (
                userNativeCurrencyBalance &&
                parsedBond > userNativeCurrencyBalance.value
            )
                bondErrorText = "Test";
            else if (parsedBond < minimumBond) bondErrorText = "Test";
            setBondErrorText(bondErrorText);
        },
        [nativeCurrency.decimals, userNativeCurrencyBalance, minimumBond]
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
                        summary: "Test",
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
    }, [postAnswerAsync, onTx, publicClient]);

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
                        summary: "Test",
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
    }, [reopenAnswerAsync, onTx, publicClient]);

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
                        summary: "Test",
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
    }, [finalizeOracleAsync, onTx, publicClient]);

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
                        summary: "Test",
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
    }, [requestArbitrationAsync, onTx, publicClient]);

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
                        summary: "Test",
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
    }, [claimMultipleAndWithdrawAsync, onTx, publicClient]);

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
                        summary: "Test",
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
    }, [withdrawAsync, onTx, publicClient]);

    const answerInputDisabled =
        finalized || moreOptionValue.invalid || moreOptionValue.anweredTooSoon;
    const requestArbitrationDisabled =
        finalized ||
        !requestArbitrationAsync ||
        isAnswerMissing(question) ||
        isAnswerPendingArbitration(question);
    const claimAndWithdrawVisible =
        answerer &&
        withdrawableBalance !== undefined &&
        withdrawableBalance === 0n &&
        question.historyHash !== BYTES32_ZERO;
    const withdrawVisible =
        withdrawableBalance !== undefined && withdrawableBalance > 0n;

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
                    <Typography>{"Test"}</Typography>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between">
                <div className="w-full flex border-b border-black dark:border-white">
                    <QuestionInfo
                        label={"Test"}
                        className={{
                            root: "border-r-0 md:border-r border-black dark:border-white",
                        }}
                    >
                        <Arbitrator address={question.arbitrator} />
                    </QuestionInfo>
                    {/* TODO: add rewards when implemented */}
                    {/* <QuestionInfo
                        label={"Test"}
                        className={{
                            root: "border-r-0 md:border-r dark:border-white",
                        }}
                    >
                        {!question.bounty.isZero() && chain?.id ? <></> : "-"}
                    </QuestionInfo> */}
                </div>
                <div className="w-full flex border-b border-black dark:border-white">
                    <QuestionInfo
                        label={"Test"}
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
                        label={"Test"}
                        className={{
                            root: "border-r-0 border-black dark:border-white",
                        }}
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
                            <External className="w-4 h-4 cursor-pointer" />
                        </a>
                    </QuestionInfo>
                </div>
            </div>
            {open && (
                <Answer question={question} loadingQuestion={loadingQuestion} />
            )}
            <div className="border-b border-black dark:border-white">
                <QuestionInfo
                    label={"Test"}
                    className={{
                        root: "border-r-0 border-black dark:border-white",
                    }}
                >
                    {loadingContent ? (
                        <Skeleton width="100px" />
                    ) : (
                        <Markdown className={{ root: "font-medium" }}>
                            {content}
                        </Markdown>
                    )}
                </QuestionInfo>
            </div>
            {!finalized && open && connectedAddress && (
                <Typography className={{ root: "px-6 mt-6" }}>
                    {isAnswerPendingArbitration(question) ? (
                        "Test"
                    ) : (
                        <>
                            {"Test"}
                            <a
                                className="text-orange underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://reality.eth.limo/app/docs/html/index.html"
                            >
                                {"Test"}
                            </a>
                            .
                        </>
                    )}
                </Typography>
            )}
            {!connectedAddress && (
                <div className="flex p-6 h-60 items-center justify-center w-full max-w-6xl bg-gray-200 dark:bg-black">
                    <Typography uppercase>{"Test"}</Typography>
                </div>
            )}
            {!open && (
                <div className="px-6 pt-6 flex flex-col gap-5 mb-6">
                    <Typography>{"Test"}</Typography>
                    <OpeningCountdown
                        to={question.openingTimestamp}
                        countdown={true}
                    />
                </div>
            )}
            {open &&
                connectedAddress &&
                !isAnswerPendingArbitration(question) &&
                !finalized && (
                    <div className="px-6 flex flex-col gap-4 mt-6">
                        {question.templateId ===
                            SupportedRealityTemplates.BOOL && (
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
                                    label={"Test"}
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
                                    label={"Test"}
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
                                    label={"Test"}
                                    info={
                                        <Typography variant="sm">
                                            {"Test"}
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
                                    label={"Test"}
                                    info={
                                        <Typography variant="sm">
                                            {"Test"}
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
                        {question.templateId ===
                            SupportedRealityTemplates.UINT && (
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
                                    label={"Test"}
                                    info={
                                        <Typography variant="sm">
                                            {"Test"}
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
                                    label={"Test"}
                                    info={
                                        <Typography variant="sm">
                                            {"Test"}
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
                        <BondInput
                            value={bond}
                            placeholder={formatUnits(
                                minimumBond,
                                nativeCurrency.decimals
                            )}
                            errorText={bondErrorText}
                            onChange={handleBondChange}
                            disabled={finalized}
                        />
                    </div>
                )}
            {open &&
                connectedAddress &&
                (!isAnswerPendingArbitration(question) && !finalized ? (
                    <div className="px-6 flex flex-col md:flex-row gap-5 mt-6 mb-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitAnswerDisabled}
                            loading={submitting}
                            size="small"
                        >
                            {"Test"}
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
                            {"Test"}
                        </Button>
                        {!!fees && fees.dispute !== 0n && (
                            <Popover
                                anchor={disputeFeePopoverAnchor}
                                open={disputeFeePopoverOpen}
                                className={{ root: "px-3 py-2" }}
                            >
                                <Typography variant="sm">{"Test"}</Typography>
                            </Popover>
                        )}
                    </div>
                ) : (
                    <div className="px-6 flex gap-5 mt-6 mb-6">
                        {isAnsweredTooSoon(question) && (
                            <Button
                                onClick={handleReopenSubmit}
                                disabled={!reopenAnswerAsync}
                                loading={submitting}
                                size="small"
                            >
                                {"Test"}
                            </Button>
                        )}
                        {!isAnsweredTooSoon(question) && (
                            <Button
                                onClick={handleFinalizeOracleSubmit}
                                disabled={
                                    !finalizeOracleAsync || oracle.finalized
                                }
                                loading={finalizingOracle}
                                size="small"
                            >
                                {"Test"}
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
                                {"Test"}
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
                                {"Test"}
                            </Button>
                        )}
                    </div>
                ))}
        </div>
    );
};
