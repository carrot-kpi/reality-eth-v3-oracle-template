#!/usr/bin/env node

const { join } = require("path");
const { readFile, writeFile } = require("fs/promises");

const REALITYV3_ADDRESS = {
    5: "0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f",
};

const [, , chainId] = process.argv;

if (!chainId) {
    console.error("a chain id is required");
    process.exit(0);
}

const realityV3Address = REALITYV3_ADDRESS[chainId];
if (!realityV3Address) {
    console.error(`unsupported chain id ${chainId}`);
}

const generate = async () => {
    let source = (
        await readFile(join(__dirname, "./src/RealityV3Oracle.sol"))
    ).toString();
    source = source.replace(
        "address(123456789)",
        `address(${realityV3Address})`
    );

    await writeFile(
        join(__dirname, `./src/RealityV3Oracle${chainId}.sol`),
        source
    );
};

generate().then().catch(console.error);
