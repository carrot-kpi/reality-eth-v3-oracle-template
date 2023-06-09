import "../global.css";
import "@carrot-kpi/ui/styles.css";

import {
    type ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { type OracleRemoteCreationFormProps } from "@carrot-kpi/react";
import {
    Select,
    type SelectOption,
    NumberInput,
    MarkdownInput,
    DateTimeInput,
    Typography,
} from "@carrot-kpi/ui";
import { useDecentralizedStorageUploader } from "@carrot-kpi/react";
import { useNetwork } from "wagmi";
import {
    SupportedChainId,
    ARBITRATORS_BY_CHAIN,
    REALITY_TEMPLATE_OPTIONS,
    TIMEOUT_OPTIONS,
    MINIMUM_ANSWER_PERIODS_AMOUNT,
} from "../commons";
import type { OptionForArbitrator, State } from "./types";
import { ArbitratorOption } from "./components/arbitrator-option";
import dayjs, { Dayjs } from "dayjs";
import durationPlugin from "dayjs/plugin/duration";
import { useArbitratorsDisputeFee } from "../hooks/useArbitratorsDisputeFee";
import { encodeAbiParameters, parseUnits } from "viem";
import { type Address } from "viem";

dayjs.extend(durationPlugin);

const stripHtml = (value: string) => value.replace(/(<([^>]+)>)/gi, "");

const checkMinimumQuestionTimeoutWindows = (
    openingTimestamp: Dayjs,
    questionTimeoutSeconds: number,
    kpiTokenExpirationTimestamp: number
): boolean => {
    return (
        openingTimestamp
            .add(
                dayjs.duration({
                    seconds:
                        questionTimeoutSeconds * MINIMUM_ANSWER_PERIODS_AMOUNT,
                })
            )
            .unix() < kpiTokenExpirationTimestamp
    );
};

export const Component = ({
    t,
    state,
    kpiToken,
    onChange,
}: OracleRemoteCreationFormProps<State>): ReactElement => {
    const { chain } = useNetwork();
    const uploadToIpfs = useDecentralizedStorageUploader("ipfs");

    const arbitratorAddresses = useMemo(
        () =>
            !chain || !(chain.id in SupportedChainId)
                ? []
                : ARBITRATORS_BY_CHAIN[chain.id as SupportedChainId].map(
                      (arbitrator) => arbitrator.value.toString() as Address
                  ),
        [chain]
    );

    const { fees: arbitratorDisputeFees } =
        useArbitratorsDisputeFee(arbitratorAddresses);

    const arbitratorsByChain = useMemo(
        () =>
            !chain || !(chain.id in SupportedChainId)
                ? []
                : ARBITRATORS_BY_CHAIN[chain.id as SupportedChainId].map(
                      (arbitrator) => ({
                          ...arbitrator,
                          disputeFee: arbitratorDisputeFees[arbitrator.value],
                      })
                  ),
        [chain, arbitratorDisputeFees]
    );

    const timeoutOptions = TIMEOUT_OPTIONS.map((option) => {
        return {
            label: t(option.tKey),
            value: option.seconds,
        };
    });

    const [arbitrator, setArbitrator] = useState<OptionForArbitrator | null>(
        state.arbitrator
            ? arbitratorsByChain.find(
                  (option) => option.value === state.arbitrator
              ) || null
            : null
    );
    const [realityTemplateId, setRealityTemplateId] =
        useState<SelectOption<number> | null>(
            state.realityTemplateId !== null &&
                state.realityTemplateId !== undefined
                ? REALITY_TEMPLATE_OPTIONS.find(
                      (option) => option.value === state.realityTemplateId
                  ) || null
                : null
        );
    const [question, setQuestion] = useState(state.question || "");

    const [questionTimeout, setQuestionTimeout] =
        useState<SelectOption<number> | null>(null);
    const [openingTimestamp, setOpeningTimestamp] = useState<Dayjs | null>(
        null
    );
    const [minimumBond, setMinimumBond] = useState(state.minimumBond || "");

    const [openingTimestampErrorText, setOpeningTimestampErrorText] =
        useState("");
    const [questionErrorText, setQuestionErrorText] = useState("");
    const [minimumBondErrorText, setMinimumBondErrorText] = useState("");

    const [minimumDate, setMinimumDate] = useState(new Date());
    const [maximumDate, setMaximumDate] = useState(new Date());

    useEffect(() => {
        if (!state.questionTimeout) return;
        const optionFromExternalState = TIMEOUT_OPTIONS.find(
            (option) => option.seconds === state.questionTimeout
        );
        if (!optionFromExternalState) return;
        setQuestionTimeout({
            label: t(optionFromExternalState.tKey),
            value: optionFromExternalState.seconds,
        });
    }, [state.questionTimeout, t]);

    useEffect(() => {
        if (!state.openingTimestamp) return;
        setOpeningTimestamp(dayjs.unix(state.openingTimestamp));
    }, [state.openingTimestamp]);

    useEffect(() => {
        if (kpiToken?.expiration)
            setMaximumDate(dayjs.unix(kpiToken.expiration).toDate());
        const interval = setInterval(() => {
            setMinimumDate(new Date());
        }, 1_000);
        return () => {
            clearInterval(interval);
        };
    }, [kpiToken?.expiration]);

    // the effect reacts to any change in internal state, firing an
    // onChange event to the creation for user when necessary.
    // onChange will also receive an initialization bundle getter function
    // when data is valid.
    useEffect(() => {
        const newState: State = {
            arbitrator: arbitrator ? (arbitrator.value as Address) : null,
            realityTemplateId: realityTemplateId
                ? (realityTemplateId.value as number)
                : null,
            question,
            questionTimeout: questionTimeout
                ? (questionTimeout.value as number)
                : null,
            openingTimestamp: openingTimestamp ? openingTimestamp.unix() : null,
            minimumBond,
        };
        let initializationDataGetter = undefined;
        if (
            chain &&
            arbitrator &&
            realityTemplateId &&
            stripHtml(question).trim() &&
            questionTimeout &&
            openingTimestamp &&
            (!kpiToken?.expiration ||
                checkMinimumQuestionTimeoutWindows(
                    openingTimestamp,
                    questionTimeout.value as number,
                    kpiToken.expiration
                )) &&
            minimumBond &&
            !isNaN(parseInt(minimumBond)) &&
            openingTimestamp.isAfter(dayjs())
        ) {
            const formattedMinimumBond = parseUnits(
                minimumBond as `${number}`,
                chain.nativeCurrency.decimals
            );
            initializationDataGetter = async () => {
                const questionCid = await uploadToIpfs(question);
                const initializationData = encodeAbiParameters(
                    [
                        { type: "address", name: "arbitratorAddress" },
                        { type: "uint256", name: "realityTemplateId" },
                        { type: "string", name: "questionIdentifier" },
                        { type: "uint32", name: "questionTimeout" },
                        { type: "uint32", name: "openingTimestamp" },
                        { type: "uint256", name: "minimumBond" },
                    ],
                    [
                        arbitrator.value as Address,
                        BigInt(realityTemplateId.value),
                        `${questionCid}-${realityTemplateId.value}`,
                        questionTimeout.value as number,
                        openingTimestamp.unix(),
                        formattedMinimumBond,
                    ]
                );
                return { data: initializationData, value: 0n };
            };
        }
        onChange(newState, initializationDataGetter);
    }, [
        arbitrator,
        chain,
        kpiToken?.expiration,
        minimumBond,
        onChange,
        openingTimestamp,
        question,
        questionTimeout,
        realityTemplateId,
        uploadToIpfs,
    ]);

    useEffect(() => {
        if (!openingTimestamp || !questionTimeout || !kpiToken?.expiration) {
            setOpeningTimestampErrorText("");
        } else {
            setOpeningTimestampErrorText(
                !checkMinimumQuestionTimeoutWindows(
                    openingTimestamp,
                    questionTimeout.value as number,
                    kpiToken.expiration
                )
                    ? t("error.opening.timestamp.tooSoon", {
                          periodsAmount: MINIMUM_ANSWER_PERIODS_AMOUNT,
                      })
                    : ""
            );
        }
    }, [kpiToken?.expiration, openingTimestamp, questionTimeout, t]);

    const handleQuestionChange = useCallback(
        (value: string) => {
            const trimmedValue = stripHtml(value).trim();
            setQuestion(value);
            setQuestionErrorText(
                !trimmedValue ? t("error.question.empty") : ""
            );
        },
        [t]
    );

    const handleOpeningTimestampChange = useCallback((value: Date) => {
        setOpeningTimestamp(dayjs(value));
    }, []);

    const handleMinimumBondChange = useCallback(
        ({ value }: { value: string }) => {
            setMinimumBond(value);
            setMinimumBondErrorText(
                !value ? t("error.minimum.bond.empty") : ""
            );
        },
        [t]
    );

    return (
        <div className="flex flex-col gap-2 w-full">
            <Typography className={{ root: "mb-2" }}>
                {t("info")}
                <a
                    className="text-orange underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://reality.eth.limo/app/docs/html/index.html"
                >
                    {t("info.here")}
                </a>
                .
            </Typography>
            <div className="flex flex-col gap-2 md:flex-row">
                <div className="w-full md:w-2/3">
                    <Select
                        id="arbitrator"
                        className={{
                            root: "w-full",
                            input: "w-full",
                            inputWrapper: "w-full",
                        }}
                        label={t("label.arbitrator")}
                        info={
                            <Typography variant="sm">
                                {t("info.arbitrator")}
                            </Typography>
                        }
                        placeholder={t("placeholder.pick")}
                        onChange={setArbitrator}
                        options={arbitratorsByChain}
                        renderOption={ArbitratorOption}
                        value={arbitrator}
                    />
                </div>
                <div className="w-full md:w-1/3">
                    <Select
                        id="reality-template"
                        className={{
                            root: "w-full",
                            input: "w-full",
                            inputWrapper: "w-full",
                        }}
                        label={t("label.reality.template")}
                        info={
                            <Typography variant="sm">
                                {t("info.reality.template")}
                            </Typography>
                        }
                        placeholder={t("placeholder.pick")}
                        onChange={setRealityTemplateId}
                        options={REALITY_TEMPLATE_OPTIONS}
                        value={realityTemplateId}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
                <div className="md:w-1/2">
                    <Select
                        id="question-timeout"
                        className={{
                            root: "w-full",
                            input: "w-full",
                            inputWrapper: "w-full",
                        }}
                        label={t("label.question.timeout")}
                        info={
                            <Typography variant="sm">
                                {t("info.question.timeout")}
                            </Typography>
                        }
                        placeholder={t("placeholder.number")}
                        options={timeoutOptions}
                        onChange={setQuestionTimeout}
                        value={questionTimeout}
                    />
                </div>
                <div className="md:w-1/2">
                    <DateTimeInput
                        id="opening-timestamp"
                        className={{
                            root: "w-full",
                            input: "w-full",
                            inputWrapper: "w-full",
                        }}
                        label={t("label.opening.timestamp")}
                        info={
                            <Typography variant="sm">
                                {t("info.opening.timestamp")}
                            </Typography>
                        }
                        placeholder={t("placeholder.number")}
                        min={minimumDate}
                        max={maximumDate}
                        onChange={handleOpeningTimestampChange}
                        value={openingTimestamp?.toDate()}
                        error={!!openingTimestampErrorText}
                        errorText={openingTimestampErrorText}
                    />
                </div>
            </div>
            <NumberInput
                id="minimum-bond"
                className={{
                    root: "w-full",
                    input: "w-full",
                    inputWrapper: "w-full",
                }}
                label={t("label.minimum.bond")}
                info={
                    <Typography variant="sm">
                        {t("info.minimum.bond")}
                    </Typography>
                }
                placeholder={t("placeholder.number")}
                onValueChange={handleMinimumBondChange}
                value={minimumBond}
                error={!!minimumBondErrorText}
                errorText={minimumBondErrorText}
            />
            <MarkdownInput
                id="question"
                label={t("label.question")}
                info={
                    <Typography variant="sm">{t("info.question")}</Typography>
                }
                placeholder={t("placeholder.pick")}
                onChange={handleQuestionChange}
                value={question}
                error={!!questionErrorText}
                errorText={questionErrorText}
                className={{
                    root: "w-full",
                    input: "w-full",
                    inputWrapper: "w-full",
                }}
            />
        </div>
    );
};
