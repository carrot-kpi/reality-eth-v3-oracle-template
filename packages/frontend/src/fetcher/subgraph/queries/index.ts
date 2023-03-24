export interface SubgraphQuestion {
    id: string;
    data: string;
    template: { templateId: string };
    contentHash: string;
    arbitrator: string;
    openingTimestamp: string;
    timeout: string;
    currentScheduledFinalizationTimestamp: string;
    isPendingArbitration: boolean;
    bounty: string;
    currentAnswer?: string;
    historyHash?: string;
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
    question?: SubgraphQuestion & { reopenedBy?: SubgraphQuestion };
}

export const GetQuestionQuery = `
    query getQuestionByID($id: ID!) {
        question(id: $id) {
            ${QuestionDataFields}
            reopenedBy {
                ${QuestionDataFields}
            }
        }
    }
`;

export interface SubgraphResponse {
    historyHash: string;
    user: string;
    bond: string;
    answer?: string;
}

export const ResponseDataFields = `
    historyHash
    user
    bond
    answer
`;

export interface GetResponsesQueryResponse {
    question?: {
        responses: SubgraphResponse[];
    };
}

export const GetResponsesQuery = `
    query getQuestionResponses($questionId: ID!) {
        question(id: $id) {
            responses(orderBy: timestamp, orderDirection: asc) {
                ${ResponseDataFields}
            }
        }
    }
`;
