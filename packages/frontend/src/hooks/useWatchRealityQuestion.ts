import { useEffect, useState } from "react";
import { useIPFSGatewayURL } from "@carrot-kpi/react";
import { useBlockNumber, useProvider } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityQuestion } from "../page/types";

export function useWatchRealityQuestion(
    realityV3Address?: string,
    questionId?: string,
    question?: string
): {
    loading: boolean;
    question: RealityQuestion | null;
} {
    const provider = useProvider();
    const blockNumber = useBlockNumber();
    const ipfsGatewayURL = useIPFSGatewayURL();

    const [loading, setLoading] = useState(true);
    const [realityQuestion, setOnChainQuestion] =
        useState<RealityQuestion | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (
                !realityV3Address ||
                !question ||
                !questionId ||
                !ipfsGatewayURL
            )
                return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchQuestion({
                    provider,
                    realityV3Address,
                    question,
                    questionId,
                    ipfsGatewayURL,
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
        blockNumber.data,
        ipfsGatewayURL,
        realityV3Address,
    ]);

    return { loading, question: realityQuestion };
}
