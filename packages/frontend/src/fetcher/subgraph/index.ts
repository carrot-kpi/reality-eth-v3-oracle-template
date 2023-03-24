import {
    FetchAnswersHistoryParams,
    FetchQuestionParams,
    IPartialFetcher,
    SupportedInChainParams,
} from "../abstraction";
import { SUBGRAPH_URL, SupportedChain } from "../../commons";
import { enforce, query } from "@carrot-kpi/sdk";
import { RealityResponse, RealityQuestion } from "../../page/types";
import { GetQuestionQuery, GetQuestionQueryResponse } from "./queries";

class Fetcher implements IPartialFetcher {
    public supportedInChain({ chainId }: SupportedInChainParams): boolean {
        return !!SUBGRAPH_URL[chainId];
    }

    public async fetchQuestion({
        provider,
        realityV3Address,
        questionId,
        ipfsGatewayURL,
    }: FetchQuestionParams): Promise<RealityQuestion | null> {
        if (!questionId || !ipfsGatewayURL) return null;

        const { chainId } = await provider.getNetwork();
        enforce(
            chainId in SupportedChain,
            `unsupported chain with id ${chainId}`
        );
        const subgraphURL = SUBGRAPH_URL[chainId as SupportedChain];
        enforce(!!subgraphURL, `no subgraph available in chain ${chainId}`);
        const { question } = await query<GetQuestionQueryResponse>(
            subgraphURL,
            GetQuestionQuery,
            {
                id: `${realityV3Address?.toLowerCase()}-${questionId?.toLowerCase()}`,
            }
        );
        if (!question) return null;

        console.log({ question });
        return null;

        // return {
        //     id: question.reopenedBy?.id ? question.reopenedBy.id : question.id,
        //     reopenedId: question.reopenedBy?.id ? question.id : undefined,
        //     historyHash: question.historyHash,
        //     templateId: question.template.templateId,
        //     content: question.data,
        //     resolvedContent: (
        //         await CoreFetcher.fetchContentFromIPFS({
        //             cids: [cid],
        //             ipfsGatewayURL,
        //         })
        //     )[cid],
        //     contentHash: question.contentHash,
        //     arbitrator: question.arbitrator,
        //     timeout: parseInt(question.timeout),
        //     openingTimestamp: parseInt(question.openingTimestamp),
        //     finalizationTimestamp: parseInt(
        //         question.currentScheduledFinalizationTimestamp
        //     ),
        //     pendingArbitration: question.isPendingArbitration,
        //     bounty: BigNumber.from(question.bounty),
        //     bestAnswer: question.currentAnswer,
        //     bond: BigNumber.from(question.currentAnswerBond),
        //     minBond: BigNumber.from(question.minBond),
        // };
    }

    public async fetchAnswersHistory({}: FetchAnswersHistoryParams): Promise<
        RealityResponse[]
    > {
        return [];
    }
}

export const SubgraphFetcher = new Fetcher();
