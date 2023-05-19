import {
    FetchAnswersHistoryParams,
    FetchQuestionParams,
    IPartialFetcher,
} from "../abstraction";
import {
    BYTES32_ZERO,
    REALITY_TEMPLATE_OPTIONS,
    SupportedChainId,
} from "../../commons";
import REALITY_ETH_V3_ABI from "../../abis/reality-eth-v3";
import { enforce, isCID } from "@carrot-kpi/sdk";
import {
    RealityResponse,
    OnChainRealityQuestion,
    RealityQuestion,
} from "../../page/types";
import {
    decodeAbiParameters,
    getContract,
    keccak256,
    parseAbiItem,
    toHex,
} from "viem";
import { type Hex } from "viem";

const LOGS_BLOCKS_SIZE = __DEV__ ? 10n : 10_000n;
const NEW_QUESTION_LOG_TOPIC = keccak256(
    toHex(
        "LogNewQuestion(bytes32,address,uint256,string,bytes32,address,uint32,uint32,uint256,uint256)"
    )
);
const NEW_ANSWER_LOG_TOPIC = keccak256(
    toHex("LogNewAnswer(bytes32,bytes32,bytes32,address,uint256,uint256,bool)")
);

class Fetcher implements IPartialFetcher {
    public supportedInChain(): boolean {
        return true;
    }

    public async fetchQuestion({
        nodeClient,
        realityV3Address,
        questionId,
        question,
    }: FetchQuestionParams): Promise<RealityQuestion | null> {
        if (!realityV3Address || !question || !questionId) return null;
        const [cid, templateId] = question.split("-");
        if (
            !isCID(cid) ||
            !templateId ||
            !REALITY_TEMPLATE_OPTIONS.find(
                (validTemplate) => validTemplate.value === templateId
            )
        )
            return null;

        const chainId = await nodeClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );
        const realityContract = getContract({
            abi: REALITY_ETH_V3_ABI,
            address: realityV3Address,
            publicClient: nodeClient,
        });

        // in case the question has been reopened, let's directly fetch the latest reopening
        let finalQuestionId = questionId;
        const reopenedQuestionId =
            await realityContract.read.reopened_questions([questionId]);
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
        } = (await realityContract.read.questions([
            finalQuestionId,
        ])) as unknown as OnChainRealityQuestion;

        return {
            id: finalQuestionId,
            reopenedId: questionId === finalQuestionId ? undefined : questionId,
            historyHash: history_hash,
            templateId: Number(templateId),
            content: question,
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
        nodeClient,
        realityV3Address,
        questionId,
    }: FetchAnswersHistoryParams): Promise<RealityResponse[]> {
        if (!realityV3Address || !questionId) return [];
        const chainId = await nodeClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );

        let toBlock = await nodeClient.getBlockNumber();
        let fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        const answersFromLogs: RealityResponse[] = [];
        try {
            while (true) {
                // FIXME: check if this implementation still works properly
                const newAnwersEventLogs = await nodeClient.getLogs({
                    address: realityV3Address,
                    event: parseAbiItem(
                        "event LogNewAnswer(bytes32,bytes32,bytes32,address,uint256,uint256,bool)"
                    ),
                    fromBlock,
                    toBlock,
                });
                const newQuestionEventLogs = await nodeClient.getLogs({
                    address: realityV3Address,
                    event: parseAbiItem(
                        "event LogNewQuestion(bytes32,address,uint256,string,bytes32,address,uint32,uint32,uint256,uint256)"
                    ),
                    fromBlock,
                    toBlock,
                });
                newQuestionEventLogs;

                const logs = [...newAnwersEventLogs, ...newQuestionEventLogs];
                let shouldBreak = false;
                for (const log of logs) {
                    // FIXME: is this condition still valid
                    if (log.topics[0] === NEW_ANSWER_LOG_TOPIC) {
                        // Event params: bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment
                        const [answerer] = decodeAbiParameters(
                            [{ type: "address", name: "answerer" }],
                            log.topics[2] as Hex
                        );
                        const [answer, hash, bond, timestamp] =
                            decodeAbiParameters(
                                [
                                    { type: "bytes32", name: "answer" },
                                    { type: "bytes32", name: "hash" },
                                    { type: "uint256", name: "bond" },
                                    { type: "uint256", name: "timestamp" },
                                    { type: "bool", name: "commitment" },
                                ],
                                log.data
                            );
                        answersFromLogs.push({
                            answerer,
                            bond,
                            hash,
                            answer,
                            timestamp: timestamp,
                        });
                        // FIXME: is this condition still valid
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
        return answersFromLogs.sort((a, b) => {
            return Number(a.timestamp - b.timestamp);
        });
    }
}

export const OnChainFetcher = new Fetcher();
