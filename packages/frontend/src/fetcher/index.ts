import { RealityQuestion } from "../page/types";
import { FullFetcherFetchQuestionParams, IFullFetcher } from "./abstraction";
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
}

export const Fetcher = new FullFetcher();
