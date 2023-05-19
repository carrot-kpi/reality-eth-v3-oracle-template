import { SelectOption } from "@carrot-kpi/ui";
import { FunctionComponent, SVGProps } from "react";
import { type Address } from "viem";

export interface State {
    arbitrator: Address | null;
    realityTemplateId: number | null;
    question: string;
    questionTimeout: number | null;
    openingTimestamp: number | null;
    minimumBond: string;
}

export interface OptionForArbitrator extends SelectOption {
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
    disputeFee?: string;
}
