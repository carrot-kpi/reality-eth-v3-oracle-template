import { Typography } from "@carrot-kpi/ui";
import { cx } from "class-variance-authority";
import { ReactElement, ReactNode } from "react";

interface AnswerInfoProps {
    label: string;
    children: ReactNode;
    className?: string;
}

export const AnswerInfo = ({
    label,
    children,
    className,
}: AnswerInfoProps): ReactElement => {
    return (
        <div className={cx("flex flex-col w-full gap-2 py-4 px-6", className)}>
            <Typography variant="xs" uppercase>
                {label}
            </Typography>
            <div>{children}</div>
        </div>
    );
};
