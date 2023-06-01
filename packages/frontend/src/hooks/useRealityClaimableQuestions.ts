import { useEffect, useState } from "react";
import {
    useIPFSGatewayURL,
    usePreferDecentralization,
} from "@carrot-kpi/react";
import { usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import type { Address, Hex } from "viem";

export function useRealityClaimableQuestions(
    realityV3Address?: Address,
    questionId?: Hex,
    finalized?: boolean
): {
    loading: boolean;
    claimableQuestions: Hex[];
} {
    const publicClient = usePublicClient();
    const ipfsGatewayURL = useIPFSGatewayURL();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(true);
    const [claimableQuestions, setClaimableQuestions] = useState<Hex[]>([]);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (
                !realityV3Address ||
                !questionId ||
                !finalized ||
                !ipfsGatewayURL
            )
                return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchClaimableQuestions({
                    preferDecentralization,
                    publicClient,
                    realityV3Address,
                    questionId,
                });
                if (!cancelled) setClaimableQuestions(fetched);
            } catch (error) {
                console.error(
                    "error fetching reality v3 reponed questions responses",
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
        questionId,
        ipfsGatewayURL,
        realityV3Address,
        preferDecentralization,
        finalized,
    ]);

    return { loading, claimableQuestions };
}
