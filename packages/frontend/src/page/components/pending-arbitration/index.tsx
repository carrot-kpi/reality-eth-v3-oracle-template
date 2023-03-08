import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { Typography } from "@carrot-kpi/ui";
import { ReactElement, useMemo } from "react";
import { useNetwork } from "wagmi";
import { shortenAddress } from "../../../utils";
import { RealityQuestion } from "../../types";

interface PendingArbitrationProps {
    t: NamespacedTranslateFunction;
    question: RealityQuestion | null;
}

export const PendingArbitration = ({
    t,
    question,
}: PendingArbitrationProps): ReactElement => {
    const { chain } = useNetwork();

    const blockExplorerHref = useMemo(() => {
        if (
            !!!question ||
            !question.arbitrator ||
            !chain ||
            !chain.blockExplorers
        )
            return "";
        return `${chain.blockExplorers.default.url}/address/${question.arbitrator}`;
    }, [question, chain]);

    if (!!!question || (!!question && !question.pendingArbitration))
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
                    {shortenAddress(question.arbitrator)}
                </a>{" "}
                {t("label.arbitration.peding.2")}
            </Typography>
        </div>
    );
};
