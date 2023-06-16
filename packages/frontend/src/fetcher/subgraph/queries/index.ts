import type { Address, Hash, Hex } from "viem";

export interface SubgraphQuestion {
    id: Hex;
    data: string;
    template: { templateId: number };
    contentHash: Hash;
    arbitrator: Address;
    openingTimestamp: string;
    timeout: string;
    finalizationTimestamp: string;
    pendingArbitration: boolean;
    bounty: string;
    currentAnswer?: string;
    historyHash?: Hash;
    currentAnswerBond: string;
    minBond: string;
}

export const QuestionDataFields = `
    id: questionId
    data
    template {
        templateId
    }
    contentHash
    arbitrator
    openingTimestamp
    timeout
    finalizationTimestamp: currentScheduledFinalizationTimestamp
    pendingArbitration: isPendingArbitration
    bounty
    currentAnswer
    historyHash
    currentAnswerBond
    minBond
`;

export interface GetQuestionQueryResponse {
    question?: SubgraphQuestion & {
        reopenedBy?: SubgraphQuestion;
        reopens?: SubgraphQuestion;
    };
}

export const GetQuestionQuery = `
    query getQuestionByID($questionId: ID!) {
        question(id: $questionId) {
            ${QuestionDataFields}
            reopenedBy {
                ${QuestionDataFields}
            }
            reopens {
                ${QuestionDataFields}
            }
        }
    }
`;

export interface SubgraphResponse {
    historyHash: Hash;
    user: Address;
    bond: string;
    answer?: Hex;
    timestamp: string;
}

export const ResponseDataFields = `
    historyHash
    user
    bond
    answer
    timestamp
`;

export interface GetResponsesQueryResponse {
    question?: {
        responses: SubgraphResponse[];
    };
}

export const GetResponsesQuery = `
    query getQuestionResponses($questionId: ID!) {
        question(id: $questionId) {
            responses(orderBy: timestamp, orderDirection: asc) {
                ${ResponseDataFields}
            }
        }
    }
`;

export interface IsAnswererQueryResponse {
    question?: {
        responses: SubgraphResponse[];
    };
}

export const IsAnswererQuery = `
    query isAnswerer($questionId: ID!, $user: Bytes!) {
        question(id: $questionId) {
            responses(where: { user: $user }) {
                ${ResponseDataFields}
            }
        }
    }
`;
