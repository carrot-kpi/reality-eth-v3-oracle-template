import { BigNumber } from "ethers";

// TODO: find a better way to encode the answer values
export const numberToByte32 = (num: string | number): string => {
    const hex = BigNumber.from(num).toHexString();

    const frontZeros = "0".repeat(66 - hex.length);

    return `0x${frontZeros}${hex.split("0x")[1]}`;
};

export const shortenAddress = (address?: string) => {
    return address
        ? `${address.slice(0, 6)}...${address.substring(38)}`
        : undefined;
};

export const isInThePast = (date: Date) => {
    return date.getTime() < Date.now();
};
