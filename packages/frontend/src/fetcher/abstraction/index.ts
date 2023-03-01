import { Provider } from "@ethersproject/providers";
import { ChainId } from "@carrot-kpi/sdk";
import { RealityQuestion } from "../../page/types";

export interface SupportedInChainParams {
    chainId: ChainId;
}

export interface FetchQuestionParams {
    provider: Provider;
    question?: string;
    questionId?: string;
}

export interface IPartialFetcher {
    supportedInChain(params: SupportedInChainParams): boolean;

    fetchQuestion(params: FetchQuestionParams): Promise<RealityQuestion | null>;
}

export interface DecentralizationParams {
    preferDecentralization?: boolean;
}

export type FullFetcherFetchQuestionParams = FetchQuestionParams &
    DecentralizationParams;

export interface IFullFetcher {
    fetchQuestion(
        params: FullFetcherFetchQuestionParams
    ): Promise<RealityQuestion | null>;
}
