import { BigNumber, Contract } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useProvider } from "wagmi";
import { REALITY_CONTRACT_BY_CHAIN, SupportedChain } from "../commons";
import REALITY_ETH_V3_ABI from "../abis/reality-eth-v3.json";

export function useRealityAnswer(questionId: string | undefined): {
    loading: boolean;
    data: BigNumber | undefined;
} {
    const { chain } = useNetwork();
    const provider = useProvider();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BigNumber>();

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!chain || chain.id in SupportedChain === false) return;
            if (!questionId) return;
            if (!cancelled) setLoading(true);

            try {
                const realityContract = new Contract(
                    REALITY_CONTRACT_BY_CHAIN[chain.id as SupportedChain],
                    REALITY_ETH_V3_ABI,
                    provider
                );

                if (!questionId || !realityContract) return;

                const answer = await realityContract.resultFor(questionId);

                if (!cancelled) {
                    console.log("ANSWER", { answer });
                    setData(BigNumber.from(answer));
                }
            } catch (error) {
                console.error("error fetching reality v3 answer", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, [chain, provider, questionId]);

    return { loading, data };
}
