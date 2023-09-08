import type {
    FetchClaimableHistoryParams,
    FetchQuestionParams,
    IPartialFetcher,
    IsAnswererParams,
    SupportedInChainParams,
} from "../abstraction";
import {
    BYTES32_ZERO,
    SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE,
    SUBGRAPH_URL,
    SupportedChainId,
} from "../../commons";
import {
    CHAIN_ADDRESSES,
    enforce,
    query,
    type ChainAddresses,
} from "@carrot-kpi/sdk";
import type { RealityResponse, RealityQuestion } from "../../page/types";
import {
    GetQuestionQuery,
    type GetQuestionQueryResponse,
    type GetResponsesQueryResponse,
    GetResponsesQuery,
    IsAnswererQuery,
    type IsAnswererQueryResponse,
} from "./queries";
import { type Hex } from "viem";
import type { PublicClient } from "wagmi";

class Fetcher implements IPartialFetcher {
    public supportedInChain({ chainId }: SupportedInChainParams): boolean {
        return (
            chainId in SupportedChainId &&
            !!SUBGRAPH_URL[chainId as unknown as SupportedChainId]
        );
    }

    public async fetchQuestion({
        publicClient,
        realityV3Address,
        questionId,
    }: FetchQuestionParams): Promise<RealityQuestion | null> {
        if (!questionId || !realityV3Address) return null;
        const { subgraphURL } = await this.validate({ publicClient });

        const { question } = await query<GetQuestionQueryResponse>(
            subgraphURL,
            GetQuestionQuery,
            {
                questionId: `${realityV3Address.toLowerCase()}-${questionId.toLowerCase()}`,
            },
        );
        if (!question) return null;

        // handle reopenings by always using the latest
        // reopener question, if any
        const finalQuestion = question.reopenedBy || question;

        return {
            id: finalQuestion.id,
            reopenedId:
                questionId === finalQuestion.id ? undefined : questionId,
            historyHash: finalQuestion.historyHash || BYTES32_ZERO,
            templateId: Number(finalQuestion.template.templateId),
            content: finalQuestion.data,
            contentHash: finalQuestion.contentHash,
            arbitrator: finalQuestion.arbitrator,
            timeout: Number(finalQuestion.timeout),
            openingTimestamp: Number(finalQuestion.openingTimestamp),
            finalizationTimestamp:
                finalQuestion.finalizationTimestamp ===
                SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE
                    ? 0
                    : Number(finalQuestion.finalizationTimestamp),
            pendingArbitration: finalQuestion.pendingArbitration,
            bounty: BigInt(finalQuestion.bounty),
            bestAnswer: finalQuestion.currentAnswer || BYTES32_ZERO,
            bond: BigInt(finalQuestion.currentAnswerBond),
            minBond: BigInt(finalQuestion.minBond),
        };
    }

    public async fetchClaimableHistory({
        realityV3Address,
        questionId,
        publicClient,
    }: FetchClaimableHistoryParams): Promise<Record<Hex, RealityResponse[]>> {
        if (!questionId || !realityV3Address) return {};
        const { subgraphURL } = await this.validate({ publicClient });

        let answersHistory: Record<Hex, Required<RealityResponse>[]> = {};
        let currentQuestionId: Hex = questionId;
        while (true) {
            const getQuestionResponse = await query<GetQuestionQueryResponse>(
                subgraphURL,
                GetQuestionQuery,
                {
                    questionId: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                },
            );

            if (!getQuestionResponse.question) break;

            const getResponsesResponse = await query<GetResponsesQueryResponse>(
                subgraphURL,
                GetResponsesQuery,
                {
                    questionId: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                },
            );

            answersHistory = {
                ...answersHistory,
                [currentQuestionId]: getResponsesResponse.question?.responses,
            };

            if (!getQuestionResponse.question.reopens?.id) break;
            currentQuestionId = getQuestionResponse.question.reopens.id;
        }

        return answersHistory;
    }

    public async isAnswerer({
        realityV3Address,
        questionId,
        address,
        publicClient,
    }: IsAnswererParams): Promise<boolean> {
        if (!questionId || !realityV3Address) return false;
        const { subgraphURL } = await this.validate({ publicClient });

        let answerer = false;
        let currentQuestionId: Hex = questionId;
        while (true) {
            const getQuestionResponse = await query<GetQuestionQueryResponse>(
                subgraphURL,
                GetQuestionQuery,
                {
                    questionId: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                },
            );
            if (!getQuestionResponse.question) break;

            const isAnswererResponse = await query<IsAnswererQueryResponse>(
                subgraphURL,
                IsAnswererQuery,
                {
                    questionId: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                    user: address,
                },
            );
            if (!isAnswererResponse.question) break;

            if (isAnswererResponse.question.responses.length > 0) {
                answerer = true;
                break;
            }

            if (!getQuestionResponse.question.reopens?.id) break;
            currentQuestionId = getQuestionResponse.question.reopens.id;
        }

        return answerer;
    }

    private async validate({
        publicClient,
    }: {
        publicClient: PublicClient;
    }): Promise<{ subgraphURL: string; chainAddresses: ChainAddresses }> {
        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`,
        );
        const subgraphURL = SUBGRAPH_URL[chainId as SupportedChainId];
        enforce(!!subgraphURL, `no subgraph available in chain ${chainId}`);
        const chainAddresses = CHAIN_ADDRESSES[chainId as SupportedChainId];
        enforce(!!chainAddresses, `no addresses available in chain ${chainId}`);

        return {
            subgraphURL,
            chainAddresses,
        };
    }
}

export const SubgraphFetcher = new Fetcher();
