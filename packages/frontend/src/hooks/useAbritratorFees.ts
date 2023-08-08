import { useMemo } from "react";
import type { Address } from "viem";
import { useArbitratorsFees } from "./useArbitratorsFees";

export interface ArbitratorFees {
    loading: boolean;
    fees: {
        question: bigint;
        dispute: bigint;
    } | null;
}

export function useArbitratorFees(address?: Address): ArbitratorFees {
    const addresses = useMemo(() => (address ? [address] : []), [address]);
    const { loading, fees } = useArbitratorsFees(addresses);

    if (!address) return { loading, fees: null };
    return { loading, fees: fees[address] };
}
