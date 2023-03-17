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

export const MINIMUM_QUESTION_TIMEOUT = 120;

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
