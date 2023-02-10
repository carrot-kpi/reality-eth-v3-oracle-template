import { ChainId } from "@carrot-kpi/sdk";
import { SelectOption } from "@carrot-kpi/ui";
import { FunctionComponent, SVGProps } from "react";
import { Address } from "wagmi";
import { ReactComponent as CarrotIcon } from "../assets/carrot.svg";

export type SupportedChain = Extract<ChainId, ChainId.SEPOLIA | ChainId.GOERLI>;
export const SupportedChain = {
    [ChainId.SEPOLIA]: ChainId.SEPOLIA,
} as const;

export interface Arbitrator {
    address: Address;
    name: string;
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
}

export const ARBITRATORS_BY_CHAIN: Record<SupportedChain, Arbitrator[]> = {
    [ChainId.SEPOLIA]: [
        {
            address: "0x0000000000000000000000000000000000000001",
            name: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
    [ChainId.GOERLI]: [
        {
            address: "0x0000000000000000000000000000000000000001",
            name: "Carrot guild",
            icon: CarrotIcon,
        },
    ],
};

export const REALITY_TEMPLATE_OPTIONS: SelectOption[] = [
    {
        label: "Yes/no",
        value: "0",
    },
    {
        label: "Number",
        value: "1",
    },
];

export const MINIMUM_QUESTION_TIMEOUT = 120;
