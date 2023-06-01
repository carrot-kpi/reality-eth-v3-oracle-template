import {
    FetchAnswersHistoryParams,
    FetchQuestionParams,
    FetchClaimableQuestionsParams,
    IPartialFetcher,
} from "../abstraction";
import {
    BYTES32_ZERO,
    REALITY_TEMPLATE_OPTIONS,
    SupportedChainId,
} from "../../commons";
import REALITY_ETH_V3_ABI from "../../abis/reality-eth-v3";
import { enforce, isCID } from "@carrot-kpi/sdk";
import { RealityResponse, RealityQuestion } from "../../page/types";
import {
    decodeAbiParameters,
    getContract,
    getEventSelector,
    parseAbiItem,
} from "viem";
import { type Hex } from "viem";

const LOGS_BLOCKS_SIZE = __DEV__ ? 10n : 5_000n;
const NEW_QUESTION_LOG_TOPIC = getEventSelector(
    "LogNewQuestion(bytes32,address,uint256,string,bytes32,address,uint32,uint32,uint256,uint256)"
);
const NEW_ANSWER_LOG_TOPIC = getEventSelector(
    "LogNewAnswer(bytes32,bytes32,bytes32,address,uint256,uint256,bool)"
);

class Fetcher implements IPartialFetcher {
    public supportedInChain(): boolean {
        return true;
    }

    public async fetchQuestion({
        publicClient,
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
                (validTemplate) => validTemplate.value === Number(templateId)
            )
        )
            return null;

        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );
        const realityContract = getContract({
            abi: REALITY_ETH_V3_ABI,
            address: realityV3Address,
            publicClient,
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
        } = await realityContract.read.questions([finalQuestionId]);

        return {
            id: finalQuestionId,
            reopenedId: questionId === finalQuestionId ? undefined : questionId,
            templateId: Number(templateId),
            content: question,
            contentHash: content_hash,
            arbitrator,
            openingTimestamp: opening_ts,
            timeout: timeout,
            finalizationTimestamp: finalize_ts,
            pendingArbitration: is_pending_arbitration,
            bounty,
            bestAnswer: best_answer,
            historyHash: history_hash,
            bond: bond,
            minBond: min_bond,
        };
    }

    public async fetchAnswersHistory({
        publicClient,
        realityV3Address,
        questionId,
    }: FetchAnswersHistoryParams): Promise<RealityResponse[]> {
        if (!realityV3Address || !questionId) return [];
        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );

        let toBlock = await publicClient.getBlockNumber();
        let fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        const answersFromLogs: RealityResponse[] = [];
        try {
            while (true) {
                const newAnwersEventLogs = await publicClient.getLogs({
                    address: realityV3Address,
                    event: parseAbiItem(
                        "event LogNewAnswer(bytes32 answer,bytes32 indexed question_id,bytes32 history_hash,address indexed user,uint256 bond,uint256 ts,bool is_commitment)"
                    ),
                    args: {
                        question_id: questionId,
                    },
                    fromBlock,
                    toBlock,
                });
                const newQuestionEventLogs = await publicClient.getLogs({
                    address: realityV3Address,
                    event: parseAbiItem(
                        "event LogNewQuestion(bytes32 indexed question_id,address indexed user,uint256 template_id,string question,bytes32 indexed content_hash,address arbitrator,uint32 timeout,uint32 opening_ts,uint256 nonce,uint256 created)"
                    ),
                    args: {
                        question_id: questionId,
                    },
                    fromBlock,
                    toBlock,
                });

                const logs = [...newAnwersEventLogs, ...newQuestionEventLogs];
                let shouldBreak = false;
                for (const log of logs) {
                    if (log.topics[0] === NEW_ANSWER_LOG_TOPIC) {
                        if (!log.topics[2]) {
                            continue;
                        }

                        // Event params: bytes32 answer, bytes32 indexed question_id, bytes32 history_hash, address indexed user, uint256 bond, uint256 ts, bool is_commitment
                        const [answerer] = decodeAbiParameters(
                            [{ type: "address", name: "answerer" }],
                            log.topics[2]
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
                            timestamp,
                        });
                    } else if (log.topics[0] === NEW_QUESTION_LOG_TOPIC)
                        shouldBreak = true;
                }
                if (shouldBreak) break;
                toBlock = fromBlock - 1n;
                fromBlock = fromBlock - LOGS_BLOCKS_SIZE;
            }
        } catch (error) {
            console.warn("error while fetching question logs", error);
        }
        return answersFromLogs.sort((a, b) => {
            return Number(a.timestamp - b.timestamp);
        });
    }

    public async fetchClaimableQuestions({
        publicClient,
        realityV3Address,
        questionId,
    }: FetchClaimableQuestionsParams): Promise<Hex[]> {
        if (!realityV3Address || !questionId) return [];
        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );

        const questionsHistoryFromLogs: {
            block: bigint | null;
            questionId: Hex;
        }[] = [];

        try {
            let toBlock = await publicClient.getBlockNumber();
            let fromBlock = toBlock - LOGS_BLOCKS_SIZE;
            let shouldBreak = false;

            const realityContract = getContract({
                abi: REALITY_ETH_V3_ABI,
                address: realityV3Address,
                publicClient,
            });
            const reopenerQuestion =
                await realityContract.read.reopener_questions([questionId]);

            let originalReopenedQuestionId: Hex = questionId;

            // avoid looking for an non existing reopened question event if the question id is not a reopener
            if (reopenerQuestion) {
                while (true) {
                    const lastReopenedQuestionEventLogs =
                        await publicClient.getLogs({
                            address: realityV3Address,
                            event: parseAbiItem(
                                "event LogReopenQuestion(bytes32 indexed question_id,bytes32 indexed reopened_question_id)"
                            ),
                            args: {
                                question_id: questionId,
                            },
                            fromBlock,
                            toBlock,
                        });

                    // there's always a single reopen event for a question_id
                    const lastReopenedQuestionEventLog =
                        lastReopenedQuestionEventLogs[0];

                    if (
                        !lastReopenedQuestionEventLog ||
                        !lastReopenedQuestionEventLog.topics[2]
                    ) {
                        toBlock = fromBlock - 1n;
                        fromBlock = fromBlock - LOGS_BLOCKS_SIZE;
                        continue;
                    }

                    // id of the reopened question, it's the same for each reopened event
                    // since they all refer to the same question_id
                    const [reopenedQuestionIdLog] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "reopened_question_id",
                            },
                        ],
                        lastReopenedQuestionEventLog.topics[2]
                    );

                    if (reopenedQuestionIdLog) {
                        originalReopenedQuestionId = reopenedQuestionIdLog;
                        break;
                    }
                }
            }

            toBlock = await publicClient.getBlockNumber();
            fromBlock = toBlock - LOGS_BLOCKS_SIZE;

            while (true) {
                // get all reopened events for the previous reopened_question_id
                const linkedReopenedQuestionEventLogs =
                    await publicClient.getLogs({
                        address: realityV3Address,
                        event: parseAbiItem(
                            "event LogReopenQuestion(bytes32 indexed question_id,bytes32 indexed reopened_question_id)"
                        ),
                        args: {
                            reopened_question_id: originalReopenedQuestionId,
                        },
                        fromBlock,
                        toBlock,
                    });

                // get the original new question event, used as a filter limit
                const originalNewQuestionEventLogs = await publicClient.getLogs(
                    {
                        address: realityV3Address,
                        event: parseAbiItem(
                            "event LogNewQuestion(bytes32 indexed question_id,address indexed user,uint256 template_id,string question,bytes32 indexed content_hash,address arbitrator,uint32 timeout,uint32 opening_ts,uint256 nonce,uint256 created)"
                        ),
                        args: {
                            question_id: originalReopenedQuestionId,
                        },
                        fromBlock,
                        toBlock,
                    }
                );

                for (const log of [
                    ...originalNewQuestionEventLogs,
                    ...linkedReopenedQuestionEventLogs,
                ]) {
                    if (!log.topics[1]) continue;

                    // id of the new question, after the reopening
                    const [questionId] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "question_id",
                            },
                        ],
                        log.topics[1]
                    );

                    const newQuestionEventLogs = await publicClient.getLogs({
                        address: realityV3Address,
                        event: parseAbiItem(
                            "event LogNewQuestion(bytes32 indexed question_id,address indexed user,uint256 template_id,string question,bytes32 indexed content_hash,address arbitrator,uint32 timeout,uint32 opening_ts,uint256 nonce,uint256 created)"
                        ),
                        args: {
                            question_id: questionId,
                        },
                        fromBlock,
                        toBlock,
                    });

                    // there's always a single new question event for a question_id
                    const newQuestionEventLog = newQuestionEventLogs[0];
                    if (!newQuestionEventLog || !newQuestionEventLog.topics[1])
                        continue;

                    const [questionIdFromNewEvent] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "question_id",
                            },
                        ],
                        newQuestionEventLog.topics[1]
                    );

                    const question = await realityContract.read.questions([
                        questionIdFromNewEvent,
                    ]);

                    if (question.history_hash !== BYTES32_ZERO)
                        questionsHistoryFromLogs.push({
                            block: newQuestionEventLog.blockNumber,
                            questionId: questionIdFromNewEvent,
                        });

                    if (questionIdFromNewEvent === originalReopenedQuestionId)
                        shouldBreak = true;
                }

                if (shouldBreak) break;
                toBlock = fromBlock - 1n;
                fromBlock = fromBlock - LOGS_BLOCKS_SIZE;
            }
        } catch (error) {
            console.warn("could not fetch questions history logs", error);
        }

        return questionsHistoryFromLogs
            .sort((a, b) => {
                return Number(a.block) - Number(b.block);
            })
            .map((log) => log.questionId);
    }
}

export const OnChainFetcher = new Fetcher();
