import { SelectOption } from "@carrot-kpi/ui";
import { FunctionComponent, SVGProps } from "react";

export interface OptionWithIcon extends SelectOption {
    icon: FunctionComponent<SVGProps<SVGSVGElement>>;
}
