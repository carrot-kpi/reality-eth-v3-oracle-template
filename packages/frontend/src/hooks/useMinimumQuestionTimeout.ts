import REALITY_ORACLE_V3_ABI from "../abis/reality-oracle-v3";
import { useContractRead, type Address } from "wagmi";

export function useMinimumQuestionTimeout(templateAddress?: Address): {
    loading: boolean;
    minimumQuestionTimeout?: bigint;
} {
    const { data: onChainMinimumQuestionTimeout, isLoading: loading } =
        useContractRead({
            address: templateAddress,
            abi: REALITY_ORACLE_V3_ABI,
            functionName: "minimumQuestionTimeout",
            enabled: !!templateAddress,
        });

    return { loading, minimumQuestionTimeout: onChainMinimumQuestionTimeout };
}
