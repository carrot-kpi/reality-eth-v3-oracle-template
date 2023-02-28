import { BigNumber, Contract } from "ethers";
import { useEffect, useState } from "react";
import { useNetwork, useProvider } from "wagmi";
import { REALITY_CONTRACT_BY_CHAIN, SupportedChain } from "../commons";
import REALITY_ETH_V3_ABI from "../abis/reality-eth-v3.json";

interface RealityQuestion {
    contentHash: string;
    arbitrator: string;
    openingTimestamp: number;
    timeout: number;
    finalizeTimestamp: number;
    pendingArbitration: boolean;
    bounty: BigNumber;
    bestAnswer: string;
    historyHash: string;
    bond: BigNumber;
    minBond: BigNumber;
}

export function useRealityQuestion(questionId: string | undefined): {
    loading: boolean;
    data: RealityQuestion | undefined;
} {
    const { chain } = useNetwork();
    const provider = useProvider();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<RealityQuestion>();

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

                const question = await realityContract.questions(questionId);

                if (!cancelled)
                    setData({
                        contentHash: question[0],
                        arbitrator: question[1],
                        openingTimestamp: question[2],
                        timeout: question[3],
                        finalizeTimestamp: question[4],
                        pendingArbitration: question[5],
                        bounty: question[6],
                        bestAnswer: question[7],
                        historyHash: question[8],
                        bond: question[9],
                        minBond: question[10],
                    });
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
    }, [chain, provider, questionId]);

    return { loading, data };
}
