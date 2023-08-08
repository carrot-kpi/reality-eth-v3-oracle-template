import type { Amount, Currency } from "@carrot-kpi/sdk";
import type { SelectOption } from "@carrot-kpi/ui";
import type { FunctionComponent, SVGProps } from "react";
import { type Address } from "viem";

export interface State {
    arbitrator: Address | null;
    realityTemplateId: number | null;
    question: string;
    questionTimeout: number | null;
    openingTimestamp: number | null;
    minimumBond: string;
}

export interface OptionForArbitrator extends SelectOption<Address> {
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    fees?: {
        question: Amount<Currency>;
        dispute: Amount<Currency>;
    };
}
