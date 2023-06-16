import { Typography } from "@carrot-kpi/ui";
import { cx } from "class-variance-authority";
import type { Duration } from "dayjs/plugin/duration";
import type { ReactElement } from "react";

interface CountdownFrameProps {
    label: string;
    duration: Duration;
    format: string;
    className?: { root?: string };
}

export const CountdownFrame = ({
    label,
    duration,
    format,
    className,
}: CountdownFrameProps): ReactElement => {
    return (
        <div
            className={cx(
                "flex flex-col justify-center items-center",
                className?.root
            )}
        >
            <Typography
                className={{
                    root: "text-2xl sm:text-[44px] md:text-[54px] lg:text-[64px]",
                }}
                weight="medium"
            >
                {duration.as("seconds") >= 0 ? duration.format(format) : "00"}
            </Typography>
            <Typography uppercase>{label}</Typography>
        </div>
    );
};
