import {
    FetchClaimableHistoryParams,
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

    public async fetchClaimableHistory({
        publicClient,
        realityV3Address,
        questionId,
    }: FetchClaimableHistoryParams): Promise<Record<Hex, RealityResponse[]>> {
        if (!realityV3Address || !questionId) return {};
        const chainId = await publicClient.getChainId();
        enforce(
            chainId in SupportedChainId,
            `unsupported chain with id ${chainId}`
        );

        let originalQuestionId = questionId;
        let answersHistory: Record<
            Hex,
            Required<
                RealityResponse & { logIndex: number; blockNumber: bigint }
            >[]
        > = {};
        const questionsHistory: {
            logIndex: number | null;
            blockNumber: bigint | null;
            questionId: Hex;
        }[] = [];

        const realityContract = getContract({
            abi: REALITY_ETH_V3_ABI,
            address: realityV3Address,
            publicClient,
        });
        const reopener = await realityContract.read.reopener_questions([
            questionId,
        ]);

        // look for the original question id if the current one is a reopener
        if (reopener) {
            let toBlock = await publicClient.getBlockNumber();
            let fromBlock = toBlock - LOGS_BLOCKS_SIZE;

            while (true) {
                const reopeneQuestionEventLogs = await publicClient.getLogs({
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

                if (
                    reopeneQuestionEventLogs[0] &&
                    reopeneQuestionEventLogs[0].topics[2]
                ) {
                    const [reopenedQuestionIdLog] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "reopened_question_id",
                            },
                        ],
                        reopeneQuestionEventLogs[0].topics[2]
                    );

                    originalQuestionId = reopenedQuestionIdLog;
                    break;
                }

                toBlock = fromBlock - 1n;
                fromBlock = toBlock - LOGS_BLOCKS_SIZE;
            }
        }

        let toBlock = await publicClient.getBlockNumber();
        let fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        let shouldBreak = false;
        while (true) {
            const reopenQuestionEventLogs = await publicClient.getLogs({
                address: realityV3Address,
                event: parseAbiItem(
                    "event LogReopenQuestion(bytes32 indexed question_id,bytes32 indexed reopened_question_id)"
                ),
                args: {
                    reopened_question_id: originalQuestionId,
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
                    question_id: originalQuestionId,
                },
                fromBlock,
                toBlock,
            });

            // here we have to look for both LogReopenQuestion and LogNewQuestion events by the original question id
            // otherwise, if the original LogNewQuestion event is "isolated" in a sliding window (the linked reopen in in the next 10th block)
            // we would never find it since we're relying on the presence of LogReopenQuestion events.
            const newAndReopenLogs = [
                ...newQuestionEventLogs,
                ...reopenQuestionEventLogs,
            ];
            for (const newAndReopenLog of newAndReopenLogs) {
                const [questionId] = decodeAbiParameters(
                    [
                        {
                            type: "bytes32",
                            name: "question_id",
                        },
                    ],
                    newAndReopenLog.topics[1]
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

                for (const newLog of newQuestionEventLogs) {
                    const [questionId] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "question_id",
                            },
                        ],
                        newLog.topics[1]
                    );

                    questionsHistory.push({
                        logIndex: newLog.logIndex,
                        blockNumber: newLog.blockNumber,
                        questionId,
                    });

                    // exit the loop once the original question asked is reached
                    if (questionId === originalQuestionId) shouldBreak = true;
                }
            }

            if (shouldBreak) break;
            toBlock = fromBlock - 1n;
            fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        }

        if (questionsHistory.length === 0) {
            return {};
        }

        toBlock = await publicClient.getBlockNumber();
        fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        shouldBreak = false;
        while (true) {
            const newAnwersEventLogs = await publicClient.getLogs({
                address: realityV3Address,
                event: parseAbiItem(
                    "event LogNewAnswer(bytes32 answer,bytes32 indexed question_id,bytes32 history_hash,address indexed user,uint256 bond,uint256 ts,bool is_commitment)"
                ),
                args: {
                    question_id: questionsHistory.map(
                        (question) => question.questionId
                    ),
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
                    question_id: questionsHistory.map(
                        (question) => question.questionId
                    ),
                },
                fromBlock,
                toBlock,
            });

            const logs = [...newAnwersEventLogs, ...newQuestionEventLogs];
            for (const log of logs) {
                if (log.topics[0] === NEW_ANSWER_LOG_TOPIC) {
                    const [questionId] = decodeAbiParameters(
                        [{ type: "bytes32", name: "question_id" }],
                        log.topics[1]
                    );
                    const [answerer] = decodeAbiParameters(
                        [{ type: "address", name: "answerer" }],
                        log.topics[2]
                    );
                    const [answer, hash, bond, timestamp] = decodeAbiParameters(
                        [
                            { type: "bytes32", name: "answer" },
                            { type: "bytes32", name: "hash" },
                            { type: "uint256", name: "bond" },
                            { type: "uint256", name: "timestamp" },
                            { type: "bool", name: "commitment" },
                        ],
                        log.data
                    );

                    // if the question's history hash is 0x00 it means the rewards are already been claimed,
                    // so we need to ignore its answers
                    const question = await realityContract.read.questions([
                        questionId,
                    ]);
                    if (question.history_hash === BYTES32_ZERO) continue;

                    answersHistory = {
                        ...answersHistory,
                        [questionId]: [
                            ...(answersHistory[questionId]
                                ? answersHistory[questionId]
                                : []),
                            {
                                logIndex: log.logIndex,
                                blockNumber: log.blockNumber,
                                answerer,
                                bond,
                                hash,
                                answer,
                                timestamp,
                            },
                        ],
                    };
                } else if (log.topics[0] === NEW_QUESTION_LOG_TOPIC) {
                    const [questionId] = decodeAbiParameters(
                        [
                            {
                                type: "bytes32",
                                name: "question_id",
                            },
                        ],
                        log.topics[1]
                    );

                    // once the original question has been found exit the whole fetch
                    if (questionId === originalQuestionId) shouldBreak = true;
                    break;
                }
            }

            if (shouldBreak) break;
            toBlock = fromBlock - 1n;
            fromBlock = toBlock - LOGS_BLOCKS_SIZE;
        }

        // FIXME: question ids are not correctly sorted, check, but it doesn't seem to bother Reality claim function

        const sortedAnswersHistory = Object.keys(answersHistory).reduce(
            (accumulator, questionId) => {
                return {
                    ...accumulator,
                    [questionId]: answersHistory[questionId as Hex]
                        .sort((a, b) => {
                            if (a.blockNumber === b.blockNumber)
                                return Number(a.logIndex - b.logIndex);
                            else return Number(a.blockNumber - b.blockNumber);
                        })
                        .map((answer) => {
                            return {
                                answerer: answer.answerer,
                                bond: answer.bond,
                                hash: answer.hash,
                                answer: answer.answer,
                                timestamp: answer.timestamp,
                            };
                        }),
                };
            },
            {}
        );

        return sortedAnswersHistory;
    }
}

export const OnChainFetcher = new Fetcher();
