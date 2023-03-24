import { FullRealityAnswer, RealityQuestion } from "../page/types";
import {
    FullFetcherFetchAnswersHistoryParams,
    FullFetcherFetchQuestionParams,
    IFullFetcher,
} from "./abstraction";
import { OnChainFetcher } from "./on-chain";

export * from "./abstraction";

class FullFetcher implements IFullFetcher {
    public async fetchQuestion({
        provider,
        realityV3Address,
        question,
        questionId,
        ipfsGatewayURL,
    }: FullFetcherFetchQuestionParams): Promise<RealityQuestion | null> {
        // TODO: implement subgraph fetcher
        return OnChainFetcher.fetchQuestion({
            provider,
            realityV3Address,
            question,
            questionId,
            ipfsGatewayURL,
        });
    }

    public async fetchAnswersHistory({
        provider,
        realityV3Address,
        questionId,
    }: FullFetcherFetchAnswersHistoryParams): Promise<FullRealityAnswer[]> {
        // TODO: implement subgraph fetcher
        return OnChainFetcher.fetchAnswersHistory({
            provider,
            realityV3Address,
            questionId,
        });
    }
}

export const Fetcher = new FullFetcher();
