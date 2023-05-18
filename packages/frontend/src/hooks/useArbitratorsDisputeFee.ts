import { type Address, useContractReads, useNetwork } from "wagmi";
import TRUSTED_REALITY_ARBITRATOR_V3_ABI from "../abis/trusted-reality-arbitrator-v3";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

interface ArbitratorsDiputeFee {
    fees: {
        [key: string]: string;
    };
    loading: boolean;
}

export function useArbitratorsDisputeFee(
    addresses: string[]
): ArbitratorsDiputeFee {
    const { chain } = useNetwork();
    const { data: fees, isLoading: loading } = useContractReads({
        contracts: addresses.map((address) => ({
            address: address as Address,
            abi: TRUSTED_REALITY_ARBITRATOR_V3_ABI,
            functionName: "getDisputeFee",
        })),
    });

    const [arbitratorsDisputeFee, setArbitratorsDisputeFee] = useState<
        ArbitratorsDiputeFee["fees"]
    >({});

    useEffect(() => {
        if (!chain) return;
        if (!fees) return;
        setArbitratorsDisputeFee(
            fees.reduce((accumulator, current, index) => {
                return {
                    ...(accumulator as object),
                    [addresses[index]]: formatUnits(
                        current.result as bigint,
                        chain?.nativeCurrency.decimals
                    ),
                };
            }, {}) as ArbitratorsDiputeFee["fees"]
        );
    }, [chain, addresses, fees]);

    return {
        fees: arbitratorsDisputeFee,
        loading,
    };
}
