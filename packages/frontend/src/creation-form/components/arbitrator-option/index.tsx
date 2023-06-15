import { Typography } from "@carrot-kpi/ui";
import type { OptionForArbitrator } from "../../types";

export const ArbitratorOption = ({
    label,
    icon: Icon,
}: OptionForArbitrator) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Icon className="w-7 h-7 mr-3" />
                <Typography>{label}</Typography>
            </div>
        </div>
    );
};
