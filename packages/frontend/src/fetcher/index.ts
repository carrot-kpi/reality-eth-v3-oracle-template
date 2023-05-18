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
        nodeClient,
        preferDecentralization,
    }: {
        nodeClient: PublicClient;
        preferDecentralization?: boolean;
    }) {
        if (preferDecentralization) return false;
        const chainId = await nodeClient.getChainId();
        return SubgraphFetcher.supportedInChain({ chainId });
    }

    public async fetchQuestion({
        preferDecentralization,
        nodeClient,
        realityV3Address,
        question,
        questionId,
    }: FullFetcherFetchQuestionParams): Promise<RealityQuestion | null> {
        const useSubgraph = await this.shouldUseSubgraph({
            nodeClient,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchQuestion({
                  nodeClient,
                  realityV3Address,
                  question,
                  questionId,
              })
            : OnChainFetcher.fetchQuestion({
                  nodeClient,
                  realityV3Address,
                  question,
                  questionId,
              });
    }

    public async fetchAnswersHistory({
        preferDecentralization,
        nodeClient,
        realityV3Address,
        questionId,
    }: FullFetcherFetchAnswersHistoryParams): Promise<RealityResponse[]> {
        const useSubgraph = await this.shouldUseSubgraph({
            nodeClient,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchAnswersHistory({
                  nodeClient,
                  realityV3Address,
                  questionId,
              })
            : OnChainFetcher.fetchAnswersHistory({
                  nodeClient,
                  realityV3Address,
                  questionId,
              });
    }
}

export const Fetcher = new FullFetcher();
