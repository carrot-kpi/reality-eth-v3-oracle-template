import { useEffect, useState } from "react";
import {
    useIPFSGatewayURL,
    usePreferDecentralization,
} from "@carrot-kpi/react";
import { usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityResponse } from "../page/types";
import type { Address, Hex } from "viem";

export function useRealityQuestionResponses(
    realityV3Address?: Address,
    questionIds?: Hex[]
): {
    loading: boolean;
    responses: Record<Hex, RealityResponse[]>;
} {
    const publicClient = usePublicClient();
    const ipfsGatewayURL = useIPFSGatewayURL();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(true);
    const [responses, setResponses] = useState<Record<Hex, RealityResponse[]>>(
        {}
    );

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (
                !realityV3Address ||
                !questionIds ||
                questionIds.length === 0 ||
                !ipfsGatewayURL
            )
                return;
            if (!cancelled) setLoading(true);
            try {
                for (const questionId of questionIds) {
                    const fetched = await Fetcher.fetchAnswersHistory({
                        preferDecentralization,
                        publicClient,
                        realityV3Address,
                        questionId,
                    });
                    if (!cancelled)
                        setResponses((previousState) => ({
                            ...previousState,
                            [questionId]: fetched,
                        }));
                }
            } catch (error) {
                console.error(
                    "error fetching reality v3 question responses",
                    error
                );
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
        questionIds,
        ipfsGatewayURL,
        realityV3Address,
        preferDecentralization,
    ]);

    return { loading, responses };
}
