import type {
    FetchClaimableHistoryParams,
    FetchQuestionParams,
    IPartialFetcher,
    SupportedInChainParams,
} from "../abstraction";
import {
    BYTES32_ZERO,
    SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE,
    SUBGRAPH_URL,
    SupportedChainId,
} from "../../commons";
import { enforce, query } from "@carrot-kpi/sdk";
import type { RealityResponse, RealityQuestion } from "../../page/types";
import {
    GetQuestionQuery,
    type GetQuestionQueryResponse,
    type GetResponsesQueryResponse,
    GetResponsesQuery,
} from "./queries";
import { type Hex } from "viem";

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

        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );
        const subgraphURL = SUBGRAPH_URL[chainId as SupportedChainId];
        enforce(!!subgraphURL, `no subgraph available in chain ${chainId}`);
        const { question } = await query<GetQuestionQueryResponse>(
            subgraphURL,
            GetQuestionQuery,
            {
                id: `${realityV3Address.toLowerCase()}-${questionId.toLowerCase()}`,
            }
        );
        if (!question) return null;

        return {
            id: question.reopenedBy?.id ? question.reopenedBy.id : question.id,
            reopenedId: question.reopenedBy?.id ? question.id : undefined,
            historyHash: question.historyHash || BYTES32_ZERO,
            templateId: Number(question.template.templateId),
            content: question.data,
            contentHash: question.contentHash,
            arbitrator: question.arbitrator,
            timeout: Number(question.timeout),
            openingTimestamp: Number(question.openingTimestamp),
            finalizationTimestamp:
                question.finalizationTimestamp ===
                SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE
                    ? 0
                    : Number(question.finalizationTimestamp),
            pendingArbitration: question.pendingArbitration,
            bounty: BigInt(question.bounty),
            bestAnswer: question.currentAnswer || BYTES32_ZERO,
            bond: BigInt(question.currentAnswerBond),
            minBond: BigInt(question.minBond),
        };
    }

    public async fetchClaimableHistory({
        realityV3Address,
        questionId,
        publicClient,
    }: FetchClaimableHistoryParams): Promise<Record<Hex, RealityResponse[]>> {
        if (!questionId || !realityV3Address) return {};

        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );
        const subgraphURL = SUBGRAPH_URL[chainId as SupportedChainId];
        enforce(!!subgraphURL, `no subgraph available in chain ${chainId}`);

        let answersHistory: Record<Hex, Required<RealityResponse>[]> = {};
        let currentQuestionId: Hex = questionId;
        while (true) {
            const getQuestionResponse = await query<GetQuestionQueryResponse>(
                subgraphURL,
                GetQuestionQuery,
                {
                    id: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                }
            );

            if (!getQuestionResponse.question) break;

            const getResponsesResponse = await query<GetResponsesQueryResponse>(
                subgraphURL,
                GetResponsesQuery,
                {
                    id: `${realityV3Address.toLowerCase()}-${currentQuestionId.toLowerCase()}`,
                }
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
}

export const SubgraphFetcher = new Fetcher();
