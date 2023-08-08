import { useEffect, useState } from "react";
import {
    useDevMode,
    useIPFSGatewayURL,
    usePreferDecentralization,
} from "@carrot-kpi/react";
import { usePublicClient } from "wagmi";
import { Fetcher } from "../fetcher";
import type { Address, Hex } from "viem";

export function useIsAnswerer(
    realityV3Address?: Address,
    questionId?: Hex,
    address?: Address,
    finalized?: boolean,
): {
    loading: boolean;
    answerer: boolean;
} {
    const devMode = useDevMode();
    const publicClient = usePublicClient();
    const ipfsGatewayURL = useIPFSGatewayURL();
    const preferDecentralization = usePreferDecentralization();

    const [loading, setLoading] = useState(false);
    const [answerer, setAnswerer] = useState<boolean>(false);

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
                const fetched = await Fetcher.isAnswerer({
                    preferDecentralization,
                    publicClient,
                    realityV3Address,
                    questionId,
                    address,
                    devMode,
                });
                if (!cancelled) setAnswerer(fetched);
            } catch (error) {
                console.error(
                    "error fetching reality v3 question answerers",
                    error,
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
        address,
        finalized,
        publicClient,
        questionId,
        ipfsGatewayURL,
        realityV3Address,
        preferDecentralization,
        devMode,
    ]);

    return { loading, answerer };
}
