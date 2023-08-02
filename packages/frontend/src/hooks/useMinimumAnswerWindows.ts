import REALITY_ORACLE_V3_ABI from "../abis/reality-oracle-v3";
import { useContractRead, type Address } from "wagmi";

export function useMinimumAnswerWindows(templateAddress: Address): {
    loading: boolean;
    minimumAnswerWindows?: bigint;
} {
    const { data: onChainMinimumAnswerWindows, isLoading: loading } =
        useContractRead({
            address: templateAddress,
            abi: REALITY_ORACLE_V3_ABI,
            functionName: "minimumAnswerWindows",
            enabled: !!templateAddress,
        });

    return { loading, minimumAnswerWindows: onChainMinimumAnswerWindows };
}
