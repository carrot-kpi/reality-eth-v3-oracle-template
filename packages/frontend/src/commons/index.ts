import { ChainId } from "@carrot-kpi/sdk";
import type { SelectOption } from "@carrot-kpi/ui";
import CarrotIcon from "../assets/carrot";
import type { OptionForArbitrator } from "../creation-form/types";
import { type Address } from "viem";

// TODO: add arbitrum goerli to supported chains
export enum SupportedChainId {
    GNOSIS = ChainId.GNOSIS,
    SEPOLIA = ChainId.SEPOLIA,
    SCROLL_TESTNET = ChainId.SCROLL_TESTNET,
}

export const TRUSTED_REALITY_ARBITRATORS: Record<SupportedChainId, Address> = {
    [SupportedChainId.GNOSIS]: __DEV__
        ? (CCT_TRUSTED_ARBITRATOR_ADDRESS as Address)
        : "0xFC4AB7D9D2bD20Bd2F518ef47b8160d95BD2Ac16",
    [SupportedChainId.SEPOLIA]: __DEV__
        ? (CCT_TRUSTED_ARBITRATOR_ADDRESS as Address)
        : "0x54ca9Bc25Fd623c94f5E1db4f7CEe846513AA844",
    [SupportedChainId.SCROLL_TESTNET]: __DEV__
        ? (CCT_TRUSTED_ARBITRATOR_ADDRESS as Address)
        : "0x87d24272071593B4a7907fd133E74EC30025D4F9",
};

export const ARBITRATORS_BY_CHAIN: Record<
    SupportedChainId,
    OptionForArbitrator[]
> = {
    [SupportedChainId.SEPOLIA]: [
        {
            value: TRUSTED_REALITY_ARBITRATORS[SupportedChainId.SEPOLIA],
            label: "Carrot",
            icon: CarrotIcon,
        },
    ],
    [SupportedChainId.GNOSIS]: [
        {
            value: TRUSTED_REALITY_ARBITRATORS[SupportedChainId.GNOSIS],
            label: "Carrot",
            icon: CarrotIcon,
        },
    ],
    [SupportedChainId.SCROLL_TESTNET]: [
        {
            value: TRUSTED_REALITY_ARBITRATORS[SupportedChainId.SCROLL_TESTNET],
            label: "Carrot",
            icon: CarrotIcon,
        },
    ],
};

export const SUBGRAPH_URL: Record<SupportedChainId, string | null> = {
    [SupportedChainId.GNOSIS]:
        "https://api.thegraph.com/subgraphs/name/realityeth/realityeth-xdai",
    [SupportedChainId.SEPOLIA]: null,
    [SupportedChainId.SCROLL_TESTNET]: null,
};

interface TimeoutOption {
    tKey: string;
    seconds: number;
}

// TODO: the shorter values should be disabled in production
export const TIMEOUT_OPTIONS: TimeoutOption[] = [
    {
        tKey: "option.question.timeout.1",
        seconds: 30,
    },
    {
        tKey: "option.question.timeout.2",
        seconds: 180,
    },
    {
        tKey: "option.question.timeout.3",
        seconds: 900,
    },
    {
        tKey: "option.question.timeout.4",
        seconds: 3_600,
    },
    {
        tKey: "option.question.timeout.5",
        seconds: 10_800,
    },
    {
        tKey: "option.question.timeout.6",
        seconds: 43_200,
    },
    {
        tKey: "option.question.timeout.7",
        seconds: 86_400,
    },
    {
        tKey: "option.question.timeout.8",
        seconds: 172_800,
    },
    {
        tKey: "option.question.timeout.9",
        seconds: 259_200,
    },
    {
        tKey: "option.question.timeout.10",
        seconds: 345_600,
    },
    {
        tKey: "option.question.timeout.11",
        seconds: 432_000,
    },
    {
        tKey: "option.question.timeout.12",
        seconds: 518_400,
    },
    {
        tKey: "option.question.timeout.13",
        seconds: 604_800,
    },
];

export enum SupportedRealityTemplates {
    BOOL = 0,
    UINT = 1,
}

export const REALITY_DAPP_ENDPOINT = "https://reality.eth.link/app/index.html";

export const REALITY_WEBSITE = "https://reality.eth.limo";

export const REALITY_TEMPLATE_OPTIONS: SelectOption<number>[] = [
    {
        label: "Yes/no",
        value: SupportedRealityTemplates.BOOL,
    },
    {
        label: "Number",
        value: SupportedRealityTemplates.UINT,
    },
];

export const INVALID_REALITY_ANSWER =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export const ANSWERED_TOO_SOON_REALITY_ANSWER =
    "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export const BYTES32_ZERO =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

export enum BooleanAnswer {
    NO = "0",
    YES = "1",
    INVALID_REALITY_ANSWER = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    ANSWERED_TOO_SOON_REALITY_ANSWER = "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe",
}

// the default value of the current answer finalization timestamp on
// the reality subgraph question entity.
// when the question has no answer yet, this is the finalization ts value.
export const SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE =
    "2147483647";

// the minimum amount of answer periods (they depend on what question
// timeout the user picks) that must be available between the opening
// timestamp and the KPI token expiration. These are to avoid that a
// KPI token expires before the Reality.eth question has had the time
// to be answered.
export const MINIMUM_ANSWER_PERIODS_AMOUNT = 3;
