import { type PublicClient } from "wagmi";
import type { RealityResponse, RealityQuestion } from "../../page/types";
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

export interface FetchClaimableHistoryParams {
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

    fetchClaimableHistory(
        params: FetchClaimableHistoryParams
    ): Promise<Record<Hex, RealityResponse[]>>;
}

export interface DecentralizationParams {
    preferDecentralization?: boolean;
}

type WithDecentralizationParams<T> = T & DecentralizationParams;

export type FullFetcherFetchQuestionParams =
    WithDecentralizationParams<FetchQuestionParams>;

export type FullFetcherFetchClaimableHistoryParams =
    WithDecentralizationParams<FetchClaimableHistoryParams>;

export interface IFullFetcher {
    fetchQuestion(
        params: FullFetcherFetchQuestionParams
    ): Promise<RealityQuestion | null>;

    fetchClaimableHistory(
        params: FullFetcherFetchClaimableHistoryParams
    ): Promise<Record<Hex, RealityResponse[]>>;
}
