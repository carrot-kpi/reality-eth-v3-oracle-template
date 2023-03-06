import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { Typography } from "@carrot-kpi/ui";
import { ReactElement, useMemo } from "react";
import { useNetwork } from "wagmi";
import { shortenAddress } from "../../../utils";
import { RealityQuestion } from "../../types";

interface PendingArbitrationProps {
    t: NamespacedTranslateFunction;
    realityQuestion: RealityQuestion | null;
}

export const PendingArbitration = ({
    t,
    realityQuestion,
}: PendingArbitrationProps): ReactElement => {
    const { chain } = useNetwork();

    const blockExplorerHref = useMemo(() => {
        if (
            !!!realityQuestion ||
            !realityQuestion.arbitrator ||
            !chain ||
            !chain.blockExplorers
        )
            return "";
        return `${chain.blockExplorers.default.url}/address/${realityQuestion.arbitrator}`;
    }, [realityQuestion, chain]);

    if (
        !!!realityQuestion ||
        (!!realityQuestion && !realityQuestion.pendingArbitration)
    )
        return <></>;

    return (
        <div className="flex flex-col gap-3 p-3 rounded-xxl border border-black dark:border-white bg-white dark:bg-black">
            <Typography>
                {t("label.arbitration.peding.1")}{" "}
                <a
                    href={blockExplorerHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-orange"
                >
                    {shortenAddress(realityQuestion.arbitrator)}
                </a>{" "}
                {t("label.arbitration.peding.2")}
            </Typography>
        </div>
    );
};
