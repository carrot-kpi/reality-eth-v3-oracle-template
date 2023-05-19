import type { Hex, Address, Hash } from "viem";

export interface NumberFormatValue {
    formattedValue: string;
    value: string;
}

export interface OnChainRealityQuestion {
    content_hash: Hash;
    arbitrator: Address;
    opening_ts: number;
    timeout: number;
    finalize_ts: number;
    is_pending_arbitration: boolean;
    bounty: bigint;
    best_answer: string;
    history_hash: Hash;
    bond: bigint;
    min_bond: bigint;
}

export interface RealityQuestion {
    id: Hex;
    reopenedId?: Hex;
    historyHash: Hash;
    templateId: number;
    content: string;
    contentHash: Hash;
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
    hash: Hash;
    answerer: Address;
    bond: bigint;
    answer: Hex;
    timestamp: bigint;
}
