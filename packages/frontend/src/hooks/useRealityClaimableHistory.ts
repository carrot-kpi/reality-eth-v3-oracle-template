import { useEffect, useState } from "react";
import {
    useIPFSGatewayURL,
    usePreferDecentralization,
} from "@carrot-kpi/react";
import { usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import { RealityResponse } from "../page/types";
import type { Address, Hex } from "viem";

export function useRealityClaimableHistory(
    realityV3Address?: Address,
    questionId?: Hex,
    finalized?: boolean
): {
    loading: boolean;
    claimable: Record<Hex, RealityResponse[]>;
} {
    const publicClient = usePublicClient();
    const ipfsGatewayURL = useIPFSGatewayURL();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(true);
    const [claimable, setClaimable] = useState<Record<Hex, RealityResponse[]>>(
        {}
    );

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (
                !realityV3Address ||
                !questionId ||
                !ipfsGatewayURL ||
                !finalized
            )
                return;
            if (!cancelled) setLoading(true);
            try {
                const fetched = await Fetcher.fetchClaimableHistory({
                    preferDecentralization,
                    publicClient,
                    realityV3Address,
                    questionId,
                });
                if (!cancelled) setClaimable(fetched);
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
        finalized,
        publicClient,
        questionId,
        ipfsGatewayURL,
        realityV3Address,
        preferDecentralization,
    ]);

    return { loading, claimable };
}
