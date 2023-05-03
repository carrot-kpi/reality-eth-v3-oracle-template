import { Address, useContractReads, useNetwork } from "wagmi";
import TRUSTED_REALITY_ARBITRATOR_V3_ABI from "../abis/trusted-reality-arbitrator-v3.json";
import { BigNumber, utils } from "ethers";
import { useEffect, useState } from "react";

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
            (fees as BigNumber[]).reduce((accumulator, current, index) => {
                return {
                    ...(accumulator as object),
                    [addresses[index]]: utils.formatUnits(
                        current,
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
