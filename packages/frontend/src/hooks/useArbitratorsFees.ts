import { useContractReads, useNetwork } from "wagmi";
import TRUSTED_REALITY_ARBITRATOR_ABI from "../abis/trusted-reality-arbitrator-v3";
import REALITY_ETH_V3_ABI from "../abis/reality-eth-v3";
import { useEffect, useState } from "react";
import { type Address } from "viem";
import { REALITY_V3_ADDRESS, SupportedChainId } from "../commons";

export interface ArbitratorsFees {
    [arbitratorAddress: Address]: {
        question: bigint;
        dispute: bigint;
    };
}

export function useArbitratorsFees(addresses: Address[]) {
    const { chain } = useNetwork();

    const { data: onChainFees, isLoading: loading } = useContractReads({
        contracts:
            !!chain?.id && chain.id in SupportedChainId
                ? addresses.flatMap((address) => [
                      {
                          address:
                              REALITY_V3_ADDRESS[chain.id as SupportedChainId],
                          abi: REALITY_ETH_V3_ABI,
                          functionName: "arbitrator_question_fees",
                          args: [address],
                      },
                      {
                          address,
                          abi: TRUSTED_REALITY_ARBITRATOR_ABI,
                          functionName: "getDisputeFee",
                      },
                  ])
                : undefined,
        enabled: !!chain?.id && chain.id in SupportedChainId,
    });

    const [fees, setFees] = useState<ArbitratorsFees>({});

    useEffect(() => {
        if (!chain || !onChainFees || loading) return;
        const finalFees: ArbitratorsFees = {};
        for (let i = 0; i < onChainFees.length; i += 2) {
            const arbitratorAddress = addresses[i % 2];
            const questionFeeResult = onChainFees[i];
            const disputeFeeResult = onChainFees[i + 1];

            if (questionFeeResult.error) {
                console.warn(
                    `could not fetch question fee for arbitrator at address ${arbitratorAddress}`
                );
                continue;
            }

            if (disputeFeeResult.error) {
                console.warn(
                    `could not fetch dispute fee for arbitrator at address ${arbitratorAddress}`
                );
                continue;
            }

            finalFees[arbitratorAddress] = {
                question: questionFeeResult.result as bigint,
                dispute: disputeFeeResult.result as bigint,
            };
        }
        setFees(finalFees);
    }, [addresses, chain, loading, onChainFees]);

    return { loading, fees };
}
