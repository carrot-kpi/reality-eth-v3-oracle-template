import { usePreferDecentralization } from "@carrot-kpi/react";
import { useEffect, useState } from "react";
import { useBlockNumber, usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityQuestion } from "../page/types";
import type { Address, Hex } from "viem";

export function useWatchRealityQuestion(
    realityV3Address?: Address,
    questionId?: Hex,
    question?: string
): {
    loading: boolean;
    question: RealityQuestion | null;
} {
    const publicClient = usePublicClient();
    const blockNumber = useBlockNumber();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(true);
    const [realityQuestion, setOnChainQuestion] =
        useState<RealityQuestion | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!realityV3Address || !question || !questionId) return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchQuestion({
                    preferDecentralization,
                    publicClient,
                    realityV3Address,
                    question,
                    questionId,
                });
                if (!cancelled) setOnChainQuestion(fetched);
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
        preferDecentralization,
    ]);

    return { loading, question: realityQuestion };
}
