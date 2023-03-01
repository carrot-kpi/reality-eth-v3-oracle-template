import { useEffect, useState } from "react";
import { useBlockNumber, useProvider } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityQuestion } from "../page/types";

export function useWatchRealityQuestion(
    questionId?: string,
    question?: string
): {
    loading: boolean;
    question: RealityQuestion | null;
} {
    const provider = useProvider();
    const blockNumber = useBlockNumber();

    const [loading, setLoading] = useState(true);
    const [realityQuestion, setOnChainQuestion] =
        useState<RealityQuestion | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!questionId) return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchQuestion({
                    provider,
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
        provider,
        question,
        questionId,
        blockNumber.data, // used to force refetch at each new block
    ]);

    return { loading, question: realityQuestion };
}
