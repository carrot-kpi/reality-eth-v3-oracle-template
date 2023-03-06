import { Contract } from "@ethersproject/contracts";
import { FetchQuestionParams, IPartialFetcher } from "../abstraction";
import {
    BYTES32_ZERO,
    REALITY_TEMPLATE_OPTIONS,
    SupportedChain,
} from "../../commons";
import REALITY_ETH_V3_ABI from "../../abis/reality-eth-v3.json";
import { enforce, isCID, CoreFetcher } from "@carrot-kpi/sdk";
import { OnChainRealityQuestion, RealityQuestion } from "../../page/types";

class Fetcher implements IPartialFetcher {
    public supportedInChain(): boolean {
        return true;
    }

    public async fetchQuestion({
        provider,
        realityV3Address,
        questionId,
        question,
        ipfsGatewayURL,
    }: FetchQuestionParams): Promise<RealityQuestion | null> {
        if (!realityV3Address || !question || !questionId || !ipfsGatewayURL)
            return null;
        const [cid, templateId] = question.split("-");
        if (
            !isCID(cid) ||
            !templateId ||
            !REALITY_TEMPLATE_OPTIONS.find((validTemplate) => {
                return validTemplate.value === parseInt(templateId);
            })
        )
            return null;

        const { chainId } = await provider.getNetwork();
        enforce(
            chainId in SupportedChain,
            `unsupported chain with id ${chainId}`
        );
        const realityContract = new Contract(
            realityV3Address,
            REALITY_ETH_V3_ABI,
            provider
        );

        // in case the question has been reopened, let's directly fetch the latest reopening
        let finalQuestionId = questionId;
        const reopenedQuestionId = await realityContract.reopened_questions(
            questionId
        );
        if (reopenedQuestionId && reopenedQuestionId !== BYTES32_ZERO)
            finalQuestionId = reopenedQuestionId;

        // TODO: have the function return both the original and the latest reopened question (if any)
        const {
            content_hash,
            arbitrator,
            opening_ts,
            timeout,
            finalize_ts,
            is_pending_arbitration,
            bounty,
            best_answer,
            history_hash,
            bond,
            min_bond,
        } = (await realityContract.questions(
            finalQuestionId
        )) as OnChainRealityQuestion;

        return {
            id: finalQuestionId,
            reopenedId: questionId === finalQuestionId ? undefined : questionId,
            historyHash: history_hash,
            templateId: parseInt(templateId),
            content: question,
            resolvedContent: (
                await CoreFetcher.fetchContentFromIPFS({
                    cids: [cid],
                    ipfsGatewayURL,
                })
            )[cid],
            contentHash: content_hash,
            arbitrator,
            timeout,
            openingTimestamp: opening_ts,
            finalizationTimestamp: finalize_ts,
            pendingArbitration: is_pending_arbitration,
            bounty,
            bestAnswer: best_answer,
            bond,
            minBond: min_bond,
        };
    }
}

export const OnChainFetcher = new Fetcher();
