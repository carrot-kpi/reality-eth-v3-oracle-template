import { useEffect, useState } from "react";
import {
    useIPFSGatewayURL,
    usePreferDecentralization,
} from "@carrot-kpi/react";
import { useProvider } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityResponse } from "../page/types";

export function useRealityQuestionResponses(
    realityV3Address?: string,
    questionId?: string
): {
    loading: boolean;
    responses: RealityResponse[];
} {
    const provider = useProvider();
    const ipfsGatewayURL = useIPFSGatewayURL();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<RealityResponse[]>([]);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!realityV3Address || !questionId || !ipfsGatewayURL) return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchAnswersHistory({
                    preferDecentralization,
                    provider,
                    realityV3Address,
                    questionId,
                });
                if (!cancelled) setResponses(fetched);
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
        realityV3Address,
        preferDecentralization,
    ]);

    return { loading, responses };
}
