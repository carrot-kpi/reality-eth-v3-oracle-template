import { type PublicClient } from "wagmi";
import { RealityResponse, RealityQuestion } from "../../page/types";
import { ChainId } from "@carrot-kpi/sdk";
import type { Address, Hex } from "viem";

export interface SupportedInChainParams {
    chainId: ChainId;
}

export interface FetchQuestionParams {
    publicClient: PublicClient;
    realityV3Address?: Address;
    question?: string;
    questionId?: Hex;
}

export interface FetchAnswersHistoryParams {
    publicClient: PublicClient;
    realityV3Address?: Address;
    questionId?: Hex;
}

export interface FetchClaimableQuestionsParams {
    publicClient: PublicClient;
    realityV3Address?: Address;
    questionId?: Hex;
}

export interface IPartialFetcher {
    supportedInChain(params: SupportedInChainParams): boolean;

    fetchQuestion(params: FetchQuestionParams): Promise<RealityQuestion | null>;

    fetchAnswersHistory(
        params: FetchAnswersHistoryParams
    ): Promise<RealityResponse[] | null>;

    fetchClaimableQuestions(
        params: FetchClaimableQuestionsParams
    ): Promise<Hex[]>;
}

export interface DecentralizationParams {
    preferDecentralization?: boolean;
}

type WithDecentralizationParams<T> = T & DecentralizationParams;

export type FullFetcherFetchQuestionParams =
    WithDecentralizationParams<FetchQuestionParams>;

export type FullFetcherFetchAnswersHistoryParams =
    WithDecentralizationParams<FetchAnswersHistoryParams>;

export type FullFetcherFetchClaimableQuestionsParams =
    WithDecentralizationParams<FetchClaimableQuestionsParams>;

export interface IFullFetcher {
    fetchQuestion(
        params: FullFetcherFetchQuestionParams
    ): Promise<RealityQuestion | null>;

    fetchAnswersHistory(
        params: FullFetcherFetchAnswersHistoryParams
    ): Promise<RealityResponse[]>;

    fetchClaimableQuestions(
        params: FullFetcherFetchClaimableQuestionsParams
    ): Promise<Hex[]>;
}
