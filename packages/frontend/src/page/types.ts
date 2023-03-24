import { BigNumber } from "ethers";

export interface NumberFormatValue {
    formattedValue: string;
    value: string;
}

export interface OnChainRealityQuestion {
    content_hash: string;
    arbitrator: string;
    opening_ts: number;
    timeout: number;
    finalize_ts: number;
    is_pending_arbitration: boolean;
    bounty: BigNumber;
    best_answer: string;
    history_hash: string;
    bond: BigNumber;
    min_bond: BigNumber;
}

export interface RealityQuestion {
    id: string;
    reopenedId?: string;
    historyHash: string;
    templateId: string;
    content: string;
    resolvedContent: string;
    contentHash: string;
    arbitrator: string;
    timeout: number;
    openingTimestamp: number;
    finalizationTimestamp: number;
    pendingArbitration: boolean;
    bounty: BigNumber;
    bestAnswer: string;
    bond: BigNumber;
    minBond: BigNumber;
}

export interface RealityResponse {
    hash: string;
    answerer: string;
    bond: BigNumber;
    answer: string;
}
