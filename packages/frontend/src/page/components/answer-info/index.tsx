import { Typography } from "@carrot-kpi/ui";
import { ReactElement, ReactNode } from "react";

interface AnswerInfoProps {
    label: string;
    children: ReactNode;
}

export const AnswerInfo = ({
    label,
    children,
}: AnswerInfoProps): ReactElement => {
    return (
        <div className="flex flex-col gap-3 border-l min-w-[180px] border-black dark:border-white pl-4">
            <Typography variant="lg" uppercase>
                {label}
            </Typography>
            <div>{children}</div>
        </div>
    );
};
