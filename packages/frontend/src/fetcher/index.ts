import { providers } from "ethers";
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
        provider,
        preferDecentralization,
    }: {
        provider: providers.Provider;
        preferDecentralization?: boolean;
    }) {
        if (preferDecentralization) return false;
        const { chainId } = await provider.getNetwork();
        return SubgraphFetcher.supportedInChain({ chainId });
    }

    public async fetchQuestion({
        preferDecentralization,
        provider,
        realityV3Address,
        question,
        questionId,
    }: FullFetcherFetchQuestionParams): Promise<RealityQuestion | null> {
        const useSubgraph = await this.shouldUseSubgraph({
            provider,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchQuestion({
                  provider,
                  realityV3Address,
                  question,
                  questionId,
              })
            : OnChainFetcher.fetchQuestion({
                  provider,
                  realityV3Address,
                  question,
                  questionId,
              });
    }

    public async fetchAnswersHistory({
        preferDecentralization,
        provider,
        realityV3Address,
        questionId,
    }: FullFetcherFetchAnswersHistoryParams): Promise<RealityResponse[]> {
        const useSubgraph = await this.shouldUseSubgraph({
            provider,
            preferDecentralization,
        });
        return useSubgraph
            ? SubgraphFetcher.fetchAnswersHistory({
                  provider,
                  realityV3Address,
                  questionId,
              })
            : OnChainFetcher.fetchAnswersHistory({
                  provider,
                  realityV3Address,
                  questionId,
              });
    }
}

export const Fetcher = new FullFetcher();
