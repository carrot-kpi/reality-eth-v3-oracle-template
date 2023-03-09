import { Typography } from "@carrot-kpi/ui";
import { ReactElement } from "react";

interface CountdownFrameProps {
    label: string;
    timeFrame: string;
}

export const CountdownFrame = ({
    label,
    timeFrame,
}: CountdownFrameProps): ReactElement => {
    return (
        <div className="flex flex-col gap-6 justify-center items-center pt-3">
            <Typography
                className={{ root: "text-2xl md:text-[64px]" }}
                weight="medium"
            >
                {timeFrame}
            </Typography>
            <Typography uppercase variant="md">
                {label}
            </Typography>
        </div>
    );
};
