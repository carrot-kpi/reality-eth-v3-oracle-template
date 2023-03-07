import { Typography } from "@carrot-kpi/ui";
import { ReactElement } from "react";

interface CuntdownFrameProps {
    label: string;
    timeFrame: number;
}

export const CountdownFrame = ({
    label,
    timeFrame,
}: CuntdownFrameProps): ReactElement => {
    return (
        <div className="flex flex-col gap-6 justify-center items-center pt-3">
            <Typography className={{ root: "text-[64px]" }} weight="medium">
                {timeFrame}
            </Typography>
            <Typography uppercase variant="md">
                {label}
            </Typography>
        </div>
    );
};
