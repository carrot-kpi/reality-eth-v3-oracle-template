import { type PublicClient } from "wagmi";
import { RealityResponse, RealityQuestion } from "../page/types";
import {
    FullFetcherFetchAnswersHistoryParams,
    FullFetcherFetchQuestionParams,
    IFullFetcher,
} from "./abstraction";
import { OnChainFetcher } from "./on-chain";
import { SubgraphFetcher } from "./subgraph";

export * from "./abstraction";

class FullFetcher implements IFullFetcher {
    private async shouldUseSubgraph({
        publicClient,
        preferDecentralization,
    }: {
        publicClient: PublicClient;
        preferDecentralization?: boolean;
    }) {
        if (preferDecentralization) return false;
        const chainId = await publicClient.getChainId();
        return SubgraphFetcher.supportedInChain({ chainId });
    }

    public async fetchQuestion({
        preferDecentralization,
        publicClient,
        realityV3Address,
        question,
        questionId,
    }: FullFetcherFetchQuestionParams): Promise<RealityQuestion | null> {
        const useSubgraph = await this.shouldUseSubgraph({
            publicClient,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchQuestion({
                  publicClient,
                  realityV3Address,
                  question,
                  questionId,
              })
            : OnChainFetcher.fetchQuestion({
                  publicClient,
                  realityV3Address,
                  question,
                  questionId,
              });
    }

    public async fetchAnswersHistory({
        preferDecentralization,
        publicClient,
        realityV3Address,
        questionId,
    }: FullFetcherFetchAnswersHistoryParams): Promise<RealityResponse[]> {
        const useSubgraph = await this.shouldUseSubgraph({
            publicClient,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchAnswersHistory({
                  publicClient,
                  realityV3Address,
                  questionId,
              })
            : OnChainFetcher.fetchAnswersHistory({
                  publicClient,
                  realityV3Address,
                  questionId,
              });
    }
}

export const Fetcher = new FullFetcher();
