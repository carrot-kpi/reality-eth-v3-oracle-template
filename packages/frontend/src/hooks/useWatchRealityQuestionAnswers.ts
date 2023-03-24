import { useEffect, useState } from "react";
import { useIPFSGatewayURL } from "@carrot-kpi/react";
import { useBlockNumber, useProvider } from "wagmi";
import { Fetcher } from "../fetcher";
import { FullRealityAnswer } from "../page/types";

export function useWatchRealityQuestionAnswers(
    realityV3Address?: string,
    questionId?: string
): {
    loading: boolean;
    answers: FullRealityAnswer[];
} {
    const provider = useProvider();
    const blockNumber = useBlockNumber();
    const ipfsGatewayURL = useIPFSGatewayURL();

    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<FullRealityAnswer[]>([]);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!realityV3Address || !questionId || !ipfsGatewayURL) return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchAnswersHistory({
                    provider,
                    realityV3Address,
                    questionId,
                });
                if (!cancelled) setAnswers(fetched);
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
        questionId,
        ipfsGatewayURL,
        blockNumber.data,
        realityV3Address,
    ]);

    return { loading, answers };
}
