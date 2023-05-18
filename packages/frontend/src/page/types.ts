import { type Address } from "viem";

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
    bounty: bigint;
    best_answer: string;
    history_hash: string;
    bond: bigint;
    min_bond: bigint;
}

export interface RealityQuestion {
    id: string;
    reopenedId?: string;
    historyHash: string;
    templateId: number;
    content: string;
    contentHash: string;
    arbitrator: Address;
    timeout: number;
    openingTimestamp: number;
    finalizationTimestamp: number;
    pendingArbitration: boolean;
    bounty: bigint;
    bestAnswer: string;
    bond: bigint;
    minBond: bigint;
}

export interface RealityResponse {
    hash: string;
    answerer: string;
    bond: bigint;
    answer: string;
    timestamp: bigint;
}
