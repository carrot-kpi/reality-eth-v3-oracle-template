#!/usr/bin/env node

import { dirname, join } from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REALITYV3_ADDRESS = {
    5: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
    11155111: "0x64a0745EF9d3772d9739D9350873eD3703bE45eC",
    100: "0xE78996A233895bE74a66F451f1019cA9734205cc",
};

const [, , chainId] = process.argv;

if (!chainId) {
    console.error("a chain id is required");
    process.exit(1);
}

const realityV3Address = REALITYV3_ADDRESS[chainId];
if (!realityV3Address) {
    console.error(`unsupported chain id ${chainId}`);
    process.exit(1);
}

const sources = ["RealityV3Oracle", "TrustedRealityV3Arbitrator"];

const generate = async () => {
    for (const source of sources) {
        let code = (
            await readFile(join(__dirname, `./src/${source}.sol`))
        ).toString();
        code = code.replace(
            "address(123456789)",
            `address(${realityV3Address})`
        );

        await writeFile(join(__dirname, `./src/${source}${chainId}.sol`), code);
    }
};

generate().then().catch(console.error);
