import { Typography } from "@carrot-kpi/ui";
import { cva } from "class-variance-authority";
import { ReactElement } from "react";

interface CountdownFrameProps {
    label: string;
    timeFrame: string;
    className?: { root?: string };
}

const rootStyles = cva([
    "flex flex-col",
    "gap-3 md:gap-6",
    "justify-center items-center",
    "pt-3",
]);

export const CountdownFrame = ({
    label,
    timeFrame,
    className,
}: CountdownFrameProps): ReactElement => {
    return (
        <div className={rootStyles({ className: className?.root })}>
            <Typography
                className={{
                    root: "text-2xl sm:text-[44px] md:text-[54px] lg:text-[64px]",
                }}
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
