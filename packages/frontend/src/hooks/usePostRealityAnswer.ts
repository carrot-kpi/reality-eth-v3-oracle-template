import {
    usePrepareContractWrite,
    useNetwork,
    useContractWrite,
    Address,
} from "wagmi";
import { REALITY_CONTRACT_BY_CHAIN, SupportedChain } from "../commons";
import REALITY_ETH_V3_ABI from "../abis/reality-eth-v3";
import { BigNumber } from "ethers";

export function usePostRealityAnswer(
    bond: BigNumber,
    answer: string,
    questionId?: string
) {
    const { chain } = useNetwork();

    const { config } = usePrepareContractWrite({
        address: REALITY_CONTRACT_BY_CHAIN[chain?.id as SupportedChain],
        abi: REALITY_ETH_V3_ABI,
        functionName: "submitAnswer",
        args: [questionId as Address, answer as Address, BigNumber.from(0)],
        overrides: {
            value: bond,
        },
        enabled: !!answer && !!questionId,
        onSettled(data, error) {
            console.log("settled", { data, error });
        },
    });
    const { writeAsync: postAnswerAsync } = useContractWrite(config);

    return {
        postAnswerAsync,
    };
}
