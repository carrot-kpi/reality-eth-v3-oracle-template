import { useDevMode, usePreferDecentralization } from "@carrot-kpi/react";
import { useEffect, useState } from "react";
import { useBlockNumber, usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import type { RealityQuestion } from "../page/types";
import type { Address, Hex } from "viem";
import { isQuestionFinalized, isQuestionReopenable } from "../utils";

export function useWatchRealityQuestion(
    realityV3Address?: Address,
    questionId?: Hex,
    question?: string
): {
    loading: boolean;
    question: RealityQuestion | null;
} {
    const devMode = useDevMode();
    const publicClient = usePublicClient();
    const blockNumber = useBlockNumber();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(false);
    const [finalized, setFinalized] = useState(false);
    const [realityQuestion, setOnChainQuestion] =
        useState<RealityQuestion | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!realityV3Address || !question || !questionId || finalized)
                return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchQuestion({
                    preferDecentralization,
                    publicClient,
                    realityV3Address,
                    question,
                    questionId,
                    devMode,
                });
                if (!cancelled) setOnChainQuestion(fetched);
                const questionFinalized =
                    !!fetched &&
                    isQuestionFinalized(fetched) &&
                    !isQuestionReopenable(fetched);
                if (questionFinalized) setFinalized(questionFinalized);
            } catch (error) {
                console.error("error fetching reality v3 question", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, [
        publicClient,
        question,
        questionId,
        blockNumber.data,
        realityV3Address,
        finalized,
        preferDecentralization,
        devMode,
    ]);

    return { loading, question: realityQuestion };
}
