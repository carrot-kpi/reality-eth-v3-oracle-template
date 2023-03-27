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
    "gap-2",
    "w-full",
    "border-black [&:not(:last-child)]:border-r",
    "px-6",
    "py-4",
]);

export const QuestionInfo = ({
    label,
    children,
    className,
}: QuestionInfoProps): ReactElement => {
    return (
        <div className={rootStyles({ className: className?.root })}>
            <Typography uppercase variant="xs">
                {label}
            </Typography>
            {children}
        </div>
    );
};
