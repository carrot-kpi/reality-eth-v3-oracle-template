import {
    FetchAnswersHistoryParams,
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
import { RealityResponse, RealityQuestion } from "../../page/types";
import {
    GetQuestionQuery,
    GetQuestionQueryResponse,
    GetResponsesQuery,
    GetResponsesQueryResponse,
} from "./queries";
import { type Address } from "viem";

class Fetcher implements IPartialFetcher {
    public supportedInChain({ chainId }: SupportedInChainParams): boolean {
        return (
            chainId in SupportedChainId &&
            !!SUBGRAPH_URL[chainId as unknown as SupportedChainId]
        );
    }

    public async fetchQuestion({
        nodeClient,
        realityV3Address,
        questionId,
    }: FetchQuestionParams): Promise<RealityQuestion | null> {
        if (!questionId || !realityV3Address) return null;

        const chainId = await nodeClient.getChainId();
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
            arbitrator: question.arbitrator as Address,
            timeout: Number(question.timeout),
            openingTimestamp: Number(question.openingTimestamp),
            finalizationTimestamp:
                question.currentScheduledFinalizationTimestamp ===
                SUBGRAPH_CURRENT_ANSWER_FINALIZATION_TIMESTAMP_NULL_VALUE
                    ? 0
                    : Number(question.currentScheduledFinalizationTimestamp),
            pendingArbitration: question.isPendingArbitration,
            bounty: BigInt(question.bounty),
            bestAnswer: question.currentAnswer || BYTES32_ZERO,
            bond: BigInt(question.currentAnswerBond),
            minBond: BigInt(question.minBond),
        };
    }

    public async fetchAnswersHistory({
        realityV3Address,
        questionId,
        nodeClient,
    }: FetchAnswersHistoryParams): Promise<RealityResponse[]> {
        if (!realityV3Address || !questionId) return [];

        const chainId = await nodeClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );
        const subgraphURL = SUBGRAPH_URL[chainId as SupportedChainId];
        enforce(!!subgraphURL, `no subgraph available in chain ${chainId}`);
        const { question } = await query<GetResponsesQueryResponse>(
            subgraphURL,
            GetResponsesQuery,
            {
                questionId: `${realityV3Address?.toLowerCase()}-${questionId?.toLowerCase()}`,
            }
        );
        if (
            !question ||
            question.responses.some((response) => !response.answer)
        )
            return [];
        const responses: RealityResponse[] = [];
        for (let i = 0; i < question.responses.length; i++) {
            const rawResponse = question.responses[i];
            const answer = rawResponse.answer;
            if (!answer) return [];
            responses.push({
                answer,
                answerer: rawResponse.user,
                bond: BigInt(rawResponse.bond),
                hash: rawResponse.historyHash,
                timestamp: BigInt(rawResponse.timestamp),
            });
        }
        return responses;
    }
}

export const SubgraphFetcher = new Fetcher();
