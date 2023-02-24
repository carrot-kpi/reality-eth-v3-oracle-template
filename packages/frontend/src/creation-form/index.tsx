import "../global.css";

import {
    ChangeEvent,
    ReactElement,
    useCallback,
    useEffect,
    useState,
} from "react";
import { BigNumber, ethers } from "ethers";
import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
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
import { OptionWithIcon } from "./types";
import { ArbitratorOption } from "./components/arbitrator-option";
import dayjs from "dayjs";

interface CreationFormProps {
    t: NamespacedTranslateFunction;
    onDone: (data: string, value: ethers.BigNumber) => void;
}

export const Component = ({ t, onDone }: CreationFormProps): ReactElement => {
    const { chain } = useNetwork();
    const uploadToIpfs = useDecentralizedStorageUploader("ipfs");

    const [arbitratorsByChain, setArbitratorsByChain] = useState<
        OptionWithIcon[]
    >([]);
    const [arbitrator, setArbitrator] = useState<OptionWithIcon | null>(null);
    const [realityTemplateId, setRealityTemplateId] =
        useState<SelectOption | null>(null);
    const [question, setQuestion] = useState("");
    const [questionTimeout, setQuestionTimeout] = useState("");
    const [openingTimestamp, setOpeningTimestamp] = useState("");
    const [minimumBond, setMinimumBond] = useState("");
    const [validInput, setValidInput] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!!chain && chain.id in SupportedChain)
            setArbitratorsByChain(
                ARBITRATORS_BY_CHAIN[chain.id as SupportedChain].map(
                    (arbitrator) => {
                        return {
                            label: arbitrator.name,
                            value: arbitrator.address,
                            icon: arbitrator.icon,
                        };
                    }
                )
            );
    }, [chain]);

    useEffect(() => {
        setValidInput(
            !!arbitrator &&
                !!realityTemplateId &&
                !!question &&
                !!questionTimeout &&
                parseInt(questionTimeout) >= MINIMUM_QUESTION_TIMEOUT &&
                !!openingTimestamp &&
                dayjs(openingTimestamp).unix() > dayjs().unix()
        );
    }, [
        arbitrator,
        openingTimestamp,
        question,
        questionTimeout,
        realityTemplateId,
    ]);

    const handleOpeningTimestampChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setOpeningTimestamp(event.target.value);
        },
        []
    );

    const handleQuestionTimeout = useCallback(
        ({ value }: { value: string }) => {
            setQuestionTimeout(value);
        },
        []
    );

    const handleMinimumBondChange = useCallback(
        ({ value }: { value: string }) => {
            setMinimumBond(value);
        },
        []
    );

    const handleSubmit = useCallback(() => {
        if (
            !chain ||
            !arbitrator ||
            !realityTemplateId ||
            !question ||
            !questionTimeout ||
            parseInt(questionTimeout) < MINIMUM_QUESTION_TIMEOUT ||
            !openingTimestamp ||
            dayjs(openingTimestamp).unix() < dayjs().unix()
        )
            return;
        const formattedMinimumBond = ethers.utils.parseUnits(
            (minimumBond || 0).toString(),
            chain.nativeCurrency.decimals
        );
        const uploadToIpfsAndSubmit = async () => {
            setLoading(true);
            let questionCid;
            try {
                questionCid = await uploadToIpfs(question);
            } finally {
                setLoading(false);
            }
            onDone(
                ethers.utils.defaultAbiCoder.encode(
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
                        questionCid,
                        questionTimeout,
                        dayjs(openingTimestamp).unix(),
                        formattedMinimumBond,
                    ]
                ),
                BigNumber.from(0)
            );
        };
        void uploadToIpfsAndSubmit();
    }, [
        arbitrator,
        chain,
        minimumBond,
        onDone,
        openingTimestamp,
        question,
        questionTimeout,
        realityTemplateId,
        uploadToIpfs,
    ]);

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="md:flex md:gap-2">
                <Select
                    id="arbitrator"
                    className={{
                        root: "w-full",
                        wrapper: "w-full",
                        input: "w-full",
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
                        wrapper: "w-full",
                        input: "w-full",
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
                        className={{ root: "w-full", input: "w-full" }}
                        label={t("label.question.timeout")}
                        placeholder={t("placeholder.number")}
                        onValueChange={handleQuestionTimeout}
                        value={questionTimeout}
                    />
                </div>
                <div className="md:w-1/2">
                    <DateTimeInput
                        id="opening-timestamp"
                        className={{ root: "w-full", input: "w-full" }}
                        label={t("label.opening.timestamp")}
                        placeholder={t("placeholder.number")}
                        onChange={handleOpeningTimestampChange}
                        value={openingTimestamp}
                    />
                </div>
            </div>
            <NumberInput
                id="minimum-bond"
                className={{ root: "w-full", input: "w-full" }}
                label={t("label.minimum.bond")}
                placeholder={t("placeholder.number")}
                onValueChange={handleMinimumBondChange}
                value={minimumBond}
            />
            <MarkdownInput
                id="question"
                className="w-full"
                label={t("label.question")}
                placeholder={t("placeholder.pick")}
                onChange={setQuestion}
                value={question}
            />
            <Button
                className={{ root: "mt-2 w-full" }}
                onClick={handleSubmit}
                disabled={!validInput}
                loading={loading}
            >
                {t("confirm")}
            </Button>
        </div>
    );
};
