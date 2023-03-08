import { ChainId } from "@carrot-kpi/sdk";
import { SelectOption } from "@carrot-kpi/ui";
import { ReactComponent as CarrotIcon } from "../assets/carrot.svg";
import { OptionWithIcon } from "../creation-form/types";

export type SupportedChain = Extract<ChainId, ChainId.SEPOLIA | ChainId.GOERLI>;
export const SupportedChain = {
    [ChainId.SEPOLIA]: ChainId.SEPOLIA,
    [ChainId.GOERLI]: ChainId.GOERLI,
} as const;

export const ARBITRATORS_BY_CHAIN: Record<SupportedChain, OptionWithIcon[]> = {
    [ChainId.SEPOLIA]: [
        {
            value: "0x0000000000000000000000000000000000000001",
            label: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
    [ChainId.GOERLI]: [
        {
            value: "0x0000000000000000000000000000000000000001",
            label: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
};

export enum SupportedRealityTemplates {
    BOOL = "0",
    UINT = "1",
}

export const REALITY_DAPP_ENDPOINT = "https://reality.eth.link/app/index.html";

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

export const MINIMUM_QUESTION_TIMEOUT = 120;

export const INVALID_REALITY_ANSWER =
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export const ANSWERED_TOO_SOON_REALITY_ANSWER =
    "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe";

export const BYTES32_ZERO =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
