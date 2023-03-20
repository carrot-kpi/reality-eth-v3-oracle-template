import { ChainId } from "@carrot-kpi/sdk";
import { SelectOption } from "@carrot-kpi/ui";
import { ReactComponent as CarrotIcon } from "../assets/carrot.svg";
import { OptionWithIcon } from "../creation-form/types";

export type SupportedChain = Extract<ChainId, ChainId.SEPOLIA | ChainId.GNOSIS>;
export const SupportedChain = {
    [ChainId.SEPOLIA]: ChainId.SEPOLIA,
    [ChainId.GNOSIS]: ChainId.GNOSIS,
} as const;

export const TRUSTED_REALITY_ARBITRATORS: Record<ChainId, string> = {
    [ChainId.GNOSIS]: "0xe37AA274d1bb3815b63cd13064dE443423F74316",
    [ChainId.SEPOLIA]: "0x96073897873796d1950B1B04Fe2Ead8E0CA34914",
};

export const ARBITRATORS_BY_CHAIN: Record<SupportedChain, OptionWithIcon[]> = {
    [ChainId.SEPOLIA]: [
        {
            value: TRUSTED_REALITY_ARBITRATORS[ChainId.SEPOLIA],
            label: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
    [ChainId.GNOSIS]: [
        {
            value: TRUSTED_REALITY_ARBITRATORS[ChainId.GNOSIS],
            label: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
};

interface TimeoutOption {
    tKey: string;
    seconds: number;
}

export const TIMEOUT_OPTIONS: TimeoutOption[] = [];
if (__DEV__) {
    TIMEOUT_OPTIONS.push(
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
        }
    );
}
TIMEOUT_OPTIONS.push(
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
    }
);

export enum SupportedRealityTemplates {
    BOOL = "0",
    UINT = "1",
}

export const REALITY_DAPP_ENDPOINT = "https://reality.eth.link/app/index.html";

export const REALITY_WEBSITE = "https://reality.eth.limo";

export const REALITY_TEMPLATE_OPTIONS: SelectOption[] = [
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
