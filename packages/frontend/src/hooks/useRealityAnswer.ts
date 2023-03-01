import { BigNumber } from "ethers";
import { Address, useContract, useNetwork, useProvider } from "wagmi";
import { BYTES_0, REALITY_CONTRACT_BY_CHAIN, SupportedChain } from "../commons";
import REALITY_ETH_V3_ABI from "../abis/reality-eth-v3";
import { useEffect, useState } from "react";

export function useRealityAnswer(questionId?: string): {
    loading: boolean;
    data: BigNumber | null;
} {
    const { chain } = useNetwork();
    const provider = useProvider();

    const [loading, setLoading] = useState(true);
    const [realityAnswer, setRealityAnswer] = useState<BigNumber | null>(null);

    const contract = useContract({
        address: REALITY_CONTRACT_BY_CHAIN[chain?.id as SupportedChain],
        abi: REALITY_ETH_V3_ABI,
        signerOrProvider: provider,
    });

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!chain || chain.id in SupportedChain === false) return;
            if (!questionId || !contract) return;
            if (!cancelled) setLoading(true);

            try {
                if (!questionId) return;
                const answer = await contract.resultFor(questionId as Address);

                if (!cancelled && answer !== BYTES_0)
                    setRealityAnswer(BigNumber.from(answer));
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
    }, [chain, questionId, contract]);

    return {
        data: realityAnswer,
        loading,
    };
}
