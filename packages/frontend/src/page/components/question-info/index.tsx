import { ReactElement, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Typography } from "@carrot-kpi/ui";

interface QuestionInfoProps {
    label: string;
    children: ReactNode;
    bordered?: boolean;
    className?: { root?: string };
}

const rootStyles = cva([
    "flex flex-col",
    "gap-3",
    "w-full",
    "border border-black",
    "p-5",
    "rounded-xxl",
]);

export const QuestionInfo = ({
    label,
    children,
    className,
}: QuestionInfoProps): ReactElement => {
    return (
        <div className={rootStyles({ className: className?.root })}>
            <Typography uppercase variant="lg">
                {label}
            </Typography>
            <div>{children}</div>
        </div>
    );
};
