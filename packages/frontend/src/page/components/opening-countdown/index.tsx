import { ReactElement, useEffect, useState } from "react";
import dayjs from "dayjs";
import Duration from "dayjs/plugin/duration";
import { CountdownFrame } from "./countdown-frame";
import { VerticalDivider } from "./vertical-divider";
import { NamespacedTranslateFunction } from "@carrot-kpi/react";

dayjs.extend(Duration);

export interface TimerProps {
    t: NamespacedTranslateFunction;
    to: number;
    countdown?: boolean;
    className?: {
        root?: string;
        icon?: string;
    };
}

// TODO: we should investigate into rewriting the Timer component
// of the UI lib to work wth this style
export const OpeningCountdown = ({
    t,
    to,
    countdown,
}: TimerProps): ReactElement => {
    const [duration, setDuration] = useState(
        dayjs.duration(dayjs.unix(to).diff(dayjs()))
    );

    useEffect(() => {
        if (!countdown) return;
        const timer = setInterval(() => {
            setDuration(dayjs.duration(dayjs.unix(to).diff(dayjs())));
        }, 1_000);
        return () => {
            clearInterval(timer);
        };
    }, [countdown, duration, to]);

    return (
        <div className="flex gap-6 content-center">
            <CountdownFrame
                label={t("label.question.time.days")}
                timeFrame={duration.days()}
            />
            <VerticalDivider />
            <CountdownFrame
                label={t("label.question.time.hours")}
                timeFrame={duration.hours()}
            />
            <VerticalDivider />
            <CountdownFrame
                label={t("label.question.time.minutes")}
                timeFrame={duration.minutes()}
            />
            <VerticalDivider />
            <CountdownFrame
                label={t("label.question.time.seconds")}
                timeFrame={duration.seconds()}
            />
        </div>
    );
};