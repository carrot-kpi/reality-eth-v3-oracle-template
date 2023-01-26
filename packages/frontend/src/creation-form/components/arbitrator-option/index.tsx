import { Typography } from "@carrot-kpi/ui";
import { OptionWithIcon } from "../../types";

export const ArbitratorOption = ({ label, icon: Icon }: OptionWithIcon) => {
    return (
        <div className="flex items-center">
            <Icon className="w-7 h-7 mr-3" />
            <Typography>{label}</Typography>
        </div>
    );
};
