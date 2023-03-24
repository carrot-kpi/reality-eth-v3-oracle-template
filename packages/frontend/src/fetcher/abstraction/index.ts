import { Provider } from "@ethersproject/providers";
import { ChainId } from "@carrot-kpi/sdk";
import { RealityResponse, RealityQuestion } from "../../page/types";

export interface SupportedInChainParams {
    chainId: ChainId;
}

export interface FetchQuestionParams {
    provider: Provider;
    realityV3Address?: string;
    question?: string;
    questionId?: string;
}

export interface FetchAnswersHistoryParams {
    provider: Provider;
    realityV3Address?: string;
    questionId?: string;
}

export interface FetchAnswersHistoryParams {
    provider: Provider;
    realityV3Address?: string;
    questionId?: string;
}

export interface IPartialFetcher {
    supportedInChain(params: SupportedInChainParams): boolean;

    fetchQuestion(params: FetchQuestionParams): Promise<RealityQuestion | null>;

    fetchAnswersHistory(
        params: FetchAnswersHistoryParams
    ): Promise<RealityResponse[] | null>;
}

export interface DecentralizationParams {
    preferDecentralization?: boolean;
}

type WithDecentralizationParams<T> = T & DecentralizationParams;

export type FullFetcherFetchQuestionParams =
    WithDecentralizationParams<FetchQuestionParams>;

export type FullFetcherFetchAnswersHistoryParams =
    WithDecentralizationParams<FetchQuestionParams>;

export interface IFullFetcher {
    fetchQuestion(
        params: FullFetcherFetchQuestionParams
    ): Promise<RealityQuestion | null>;

    fetchAnswersHistory(
        params: FullFetcherFetchAnswersHistoryParams
    ): Promise<RealityResponse[]>;
}
