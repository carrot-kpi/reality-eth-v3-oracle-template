import { Contract } from "@ethersproject/contracts";
import {
    FetchAnswersHistoryParams,
    FetchQuestionParams,
    IPartialFetcher,
} from "../abstraction";
import {
    BYTES32_ZERO,
    REALITY_TEMPLATE_OPTIONS,
    SupportedChain,
} from "../../commons";
import REALITY_ETH_V3_ABI from "../../abis/reality-eth-v3.json";
import { enforce, isCID, CoreFetcher } from "@carrot-kpi/sdk";
import {
    RealityResponse,
    OnChainRealityQuestion,
    RealityQuestion,
} from "../../page/types";
import { utils } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils.js";

const LOGS_BLOCKS_SIZE = __DEV__ ? 10 : 10_000;
const NEW_QUESTION_LOG_TOPIC = utils.solidityKeccak256(
    ["string"],
    [
        "LogNewQuestion(bytes32,address,uint256,string,bytes32,address,uint32,uint32,uint256,uint256)",
    ]
);
const NEW_ANSWER_LOG_TOPIC = utils.solidityKeccak256(
    ["string"],
    ["LogNewAnswer(bytes32,bytes32,bytes32,address,uint256,uint256,bool)"]
);

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
            !REALITY_TEMPLATE_OPTIONS.find(
                (validTemplate) => validTemplate.value === templateId
            )
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
            templateId,
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

    public async fetchAnswersHistory({
        provider,
        realityV3Address,
        questionId,
    }: FetchAnswersHistoryParams): Promise<RealityResponse[]> {
        if (!realityV3Address || !questionId) return [];
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

        let toBlock = await provider.getBlockNumber();
        let fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        const answersFromLogs: RealityResponse[] = [];
        try {
            while (true) {
                const logs = await provider.getLogs({
                    address: realityContract.address,
                    fromBlock,
                    toBlock,
                    topics: [
                        [NEW_ANSWER_LOG_TOPIC, NEW_QUESTION_LOG_TOPIC],
                        questionId,
                    ],
                });
                let shouldBreak = false;
                for (const log of logs) {
                    if (log.topics[0] === NEW_ANSWER_LOG_TOPIC) {
                        // Event params: bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment
                        const [answerer] = defaultAbiCoder.decode(
                            ["address"],
                            log.topics[2]
                        );
                        const [answer, hash, bond] = defaultAbiCoder.decode(
                            [
                                "bytes32",
                                "bytes32",
                                "uint256",
                                "uint256",
                                "bool",
                            ],
                            log.data
                        );
                        answersFromLogs.push({
                            answerer,
                            bond,
                            hash,
                            answer,
                        });
                    } else if (log.topics[0] === NEW_QUESTION_LOG_TOPIC)
                        shouldBreak = true;
                }
                if (shouldBreak) break;
                toBlock = fromBlock;
                fromBlock = fromBlock - LOGS_BLOCKS_SIZE;
            }
        } catch (error) {
            console.warn("error while fetching question logs", error);
        }
        return answersFromLogs.reverse();
    }
}

export const OnChainFetcher = new Fetcher();
