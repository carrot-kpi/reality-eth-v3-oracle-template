import "../global.css";

import { ReactElement, useCallback, useEffect, useState } from "react";
import { BigNumber, ethers } from "ethers";
import { OracleCreationFormProps } from "@carrot-kpi/react";
import {
    Select,
    SelectOption,
    NumberInput,
    MarkdownInput,
    DateTimeInput,
} from "@carrot-kpi/ui";
import { useDecentralizedStorageUploader } from "@carrot-kpi/react";
import { useNetwork } from "wagmi";
import {
    SupportedChain,
    ARBITRATORS_BY_CHAIN,
    REALITY_TEMPLATE_OPTIONS,
    MINIMUM_QUESTION_TIMEOUT,
} from "../commons";
import { OptionWithIcon, State } from "./types";
import { ArbitratorOption } from "./components/arbitrator-option";
import dayjs, { Dayjs } from "dayjs";

const stripHtml = (value: string) => value.replace(/(<([^>]+)>)/gi, "");

export const Component = ({
    t,
    state,
    onChange,
}: OracleCreationFormProps<State>): ReactElement => {
    const { chain } = useNetwork();
    const uploadToIpfs = useDecentralizedStorageUploader("ipfs");

    const arbitratorsByChain =
        !chain || !(chain.id in SupportedChain)
            ? []
            : ARBITRATORS_BY_CHAIN[chain.id as SupportedChain];
    const [arbitrator, setArbitrator] = useState<OptionWithIcon | null>(
        state.arbitrator
            ? arbitratorsByChain.find(
                  (option) => option.value === state.arbitrator
              ) || null
            : null
    );
    const [realityTemplateId, setRealityTemplateId] =
        useState<SelectOption | null>(
            state.realityTemplateId
                ? REALITY_TEMPLATE_OPTIONS.find(
                      (option) => option.value === state.realityTemplateId
                  ) || null
                : null
        );
    const [question, setQuestion] = useState(state.question || "");
    const [questionTimeout, setQuestionTimeout] = useState(
        state.questionTimeout || ""
    );
    const [openingTimestamp, setOpeningTimestamp] = useState<Dayjs | null>(
        state.openingTimestamp ? dayjs.unix(state.openingTimestamp) : null
    );
    const [minimumBond, setMinimumBond] = useState(state.minimumBond || "");
    const [questionErrorText, setQuestionErrorText] = useState("");
    const [questionTimeoutErrorText, setQuestionTimeoutErrorText] =
        useState("");
    const [minimumBondErrorText, setMinimumBondErrorText] = useState("");

    const [minimumDate, setMinimumDate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            console.log("date");
            setMinimumDate(new Date());
        }, 1_000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    // the effect reacts to any change in internal state, firing an
    // onChange event to the creation for user when necessary.
    // onChange will also receive an initialization bundle getter function
    // when data is valid.
    useEffect(() => {
        const newState = {
            arbitrator: arbitrator ? (arbitrator.value as string) : undefined,
            realityTemplateId: realityTemplateId
                ? (realityTemplateId.value as string)
                : undefined,
            question,
            questionTimeout,
            openingTimestamp: openingTimestamp?.unix(),
            minimumBond,
        };
        let initializationDataGetter = undefined;
        if (
            chain &&
            arbitrator &&
            realityTemplateId &&
            stripHtml(question).trim() &&
            questionTimeout &&
            parseInt(questionTimeout) >= MINIMUM_QUESTION_TIMEOUT &&
            openingTimestamp &&
            openingTimestamp.isAfter(dayjs())
        ) {
            const formattedMinimumBond = ethers.utils.parseUnits(
                (minimumBond || 0).toString(),
                chain.nativeCurrency.decimals
            );
            initializationDataGetter = async () => {
                const questionCid = await uploadToIpfs(question);
                const initializationData = ethers.utils.defaultAbiCoder.encode(
                    [
                        "address",
                        "uint256",
                        "string",
                        "uint32",
                        "uint32",
                        "uint256",
                    ],
                    [
                        arbitrator.value,
                        realityTemplateId.value,
                        `${questionCid}-${realityTemplateId.value}`,
                        questionTimeout,
                        openingTimestamp.unix(),
                        formattedMinimumBond,
                    ]
                );
                const value = BigNumber.from(0);
                return { data: initializationData, value };
            };
        }
        onChange(newState, initializationDataGetter);
    }, [
        arbitrator,
        chain,
        minimumBond,
        onChange,
        openingTimestamp,
        question,
        questionTimeout,
        realityTemplateId,
        uploadToIpfs,
    ]);

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

    const handleQuestionTimeout = useCallback(
        ({ value }: { value: string }) => {
            const parsedValue = parseFloat(value);
            setQuestionTimeout(value);
            setQuestionTimeoutErrorText(
                isNaN(parsedValue) || parsedValue < MINIMUM_QUESTION_TIMEOUT
                    ? t("error.question.timeout.empty", {
                          minimum: MINIMUM_QUESTION_TIMEOUT,
                      })
                    : ""
            );
        },
        [t]
    );

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
            <div className="md:flex md:gap-2">
                <Select
                    id="arbitrator"
                    className={{
                        root: "w-full",
                        input: "w-full",
                        inputWrapper: "w-full",
                    }}
                    label={t("label.arbitrator")}
                    placeholder={t("placeholder.pick")}
                    onChange={setArbitrator}
                    options={arbitratorsByChain}
                    renderOption={ArbitratorOption}
                    value={arbitrator}
                />
                <Select
                    id="reality-template"
                    className={{
                        root: "w-full",
                        input: "w-full",
                        inputWrapper: "w-full",
                    }}
                    label={t("label.reality.template")}
                    placeholder={t("placeholder.pick")}
                    onChange={setRealityTemplateId}
                    options={REALITY_TEMPLATE_OPTIONS}
                    value={realityTemplateId}
                />
            </div>
            <div className="md:flex md:gap-2">
                <div className="md:w-1/2">
                    <NumberInput
                        id="question-timeout"
                        className={{
                            root: "w-full",
                            input: "w-full",
                            inputWrapper: "w-full",
                        }}
                        label={t("label.question.timeout")}
                        placeholder={t("placeholder.number")}
                        onValueChange={handleQuestionTimeout}
                        value={questionTimeout}
                        error={!!questionTimeoutErrorText}
                        helperText={questionTimeoutErrorText}
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
                        placeholder={t("placeholder.number")}
                        min={minimumDate}
                        onChange={handleOpeningTimestampChange}
                        value={openingTimestamp?.toDate()}
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
                placeholder={t("placeholder.number")}
                onValueChange={handleMinimumBondChange}
                value={minimumBond}
                error={!!minimumBondErrorText}
                helperText={minimumBondErrorText}
            />
            <MarkdownInput
                id="question"
                label={t("label.question")}
                placeholder={t("placeholder.pick")}
                onChange={handleQuestionChange}
                value={question}
                error={!!questionErrorText}
                helperText={questionErrorText}
                className={{
                    root: "w-full",
                    input: "w-full",
                    inputWrapper: "w-full",
                }}
            />
        </div>
    );
};
