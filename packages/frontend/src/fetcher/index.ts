import { RealityQuestion } from "../page/types";
import { FullFetcherFetchQuestionParams, IFullFetcher } from "./abstraction";
import { OnChainFetcher } from "./on-chain";

export * from "./abstraction";

class FullFetcher implements IFullFetcher {
    public async fetchQuestion({
        provider,
        question,
        questionId,
    }: FullFetcherFetchQuestionParams): Promise<RealityQuestion | null> {
        // TODO: implement subgraph fetcher
        return OnChainFetcher.fetchQuestion({ provider, question, questionId });
    }
}

export const Fetcher = new FullFetcher();
