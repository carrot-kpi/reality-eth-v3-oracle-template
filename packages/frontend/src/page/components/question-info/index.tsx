import { ReactElement, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Typography } from "@carrot-kpi/ui";

interface QuestionInfoProps {
    label: string;
    children: ReactNode;
    bordered?: boolean;
}

const rootStyles = cva(["flex flex-col", "gap-3", "w-full"], {
    variants: {
        bordered: {
            true: ["border-r border-black dark:border-white"],
        },
    },
});

export const QuestionInfo = ({
    label,
    children,
    bordered = true,
}: QuestionInfoProps): ReactElement => {
    return (
        <div className={rootStyles({ bordered })}>
            <Typography uppercase variant="lg">
                {label}
            </Typography>
            <div>{children}</div>
        </div>
    );
};
