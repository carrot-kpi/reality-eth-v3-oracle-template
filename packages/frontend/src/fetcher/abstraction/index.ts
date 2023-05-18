import { type PublicClient } from "wagmi";
import { RealityResponse, RealityQuestion } from "../../page/types";
import { ChainId } from "@carrot-kpi/sdk";

export interface SupportedInChainParams {
    chainId: ChainId;
}

export interface FetchQuestionParams {
    nodeClient: PublicClient;
    realityV3Address?: string;
    question?: string;
    questionId?: string;
}

export interface FetchAnswersHistoryParams {
    nodeClient: PublicClient;
    realityV3Address?: string;
    questionId?: string;
}

export interface FetchAnswersHistoryParams {
    nodeClient: PublicClient;
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
