import { SelectOption } from "@carrot-kpi/ui";
import { FunctionComponent, SVGProps } from "react";

export interface State {
    arbitrator: string;
    realityTemplateId: string;
    question: string;
    questionTimeout: number;
    openingTimestamp: number;
    minimumBond: string;
}

export interface OptionWithIcon extends SelectOption {
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
}
