import { ChainId } from "@carrot-kpi/sdk";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { getContract, parseUnits } from "viem";

const require = createRequire(fileURLToPath(import.meta.url));

const REALITY_V3_ADDRESS = {
    [ChainId.SEPOLIA]: "0x64a0745EF9d3772d9739D9350873eD3703bE45eC",
    [ChainId.GNOSIS]: "0xE78996A233895bE74a66F451f1019cA9734205cc",
    // TODO: add support for SCROLL_SEPOLIA once the reality.eth oracle is deployed on scroll
};
const MINIMUM_QUESTION_TIMEOUT = 60;
const MINIMUM_ANSWER_WINDOWS = 10;

export const setupFork = async ({ nodeClient, walletClient }) => {
    const chainId = await nodeClient.getChainId();

    // deploy template
    const {
        abi: templateAbi,
        bytecode: { object: templateBytecode },
    } = require(`../out/RealityV3Oracle.sol/RealityV3Oracle.json`);

    const { contractAddress: templateAddress } =
        await nodeClient.getTransactionReceipt({
            hash: await walletClient.deployContract({
                abi: templateAbi,
                bytecode: templateBytecode,
                args: [
                    REALITY_V3_ADDRESS[chainId],
                    MINIMUM_QUESTION_TIMEOUT,
                    MINIMUM_ANSWER_WINDOWS,
                ],
            }),
        });

    // deploy arbitrator
    const {
        abi: arbitratorAbi,
        bytecode: { object: arbitratorBytecode },
    } = require(`../out/TrustedRealityV3Arbitrator.sol/TrustedRealityV3Arbitrator.json`);

    const { contractAddress: arbitratorAddress } =
        await nodeClient.getTransactionReceipt({
            hash: await walletClient.deployContract({
                abi: arbitratorAbi,
                bytecode: arbitratorBytecode,
                args: [
                    REALITY_V3_ADDRESS[chainId],
                    "{}",
                    parseUnits("1", 18),
                    parseUnits("1", 18),
                ],
            }),
        });

    const arbitratorContract = getContract({
        abi: arbitratorAbi,
        address: arbitratorAddress,
        publicClient: nodeClient,
        walletClient: walletClient,
    });

    // FIXME: This ONLY works because the ERC20 KPI token template manually adds the tokens on the default token list when running in dev mode.
    // It relies on a dev-only logic present in another template.

    // deploy test erc20 tokens
    const {
        abi: erc20Abi,
        bytecode: { object: erc20Bytecode },
    } = require("../out/ERC20PresetMinterPauser.sol/ERC20PresetMinterPauser.json");
    const { contractAddress: tst1Address } =
        await nodeClient.getTransactionReceipt({
            hash: await walletClient.deployContract({
                abi: erc20Abi,
                bytecode: erc20Bytecode,
                args: ["Test token 1", "TST1"],
            }),
        });
    const tst1Contract = getContract({
        abi: erc20Abi,
        address: tst1Address,
        publicClient: nodeClient,
        walletClient: walletClient,
    });

    const { contractAddress: tst2Address } =
        await nodeClient.getTransactionReceipt({
            hash: await walletClient.deployContract({
                abi: erc20Abi,
                bytecode: erc20Bytecode,
                args: ["Test token 2", "TST2"],
            }),
        });
    const tst2Contract = getContract({
        abi: erc20Abi,
        address: tst2Address,
        publicClient: nodeClient,
        walletClient: walletClient,
    });

    // mint some test erc20 tokens to signer
    await tst1Contract.write.mint([
        walletClient.account.address,
        parseUnits("100", 18),
    ]);
    await tst2Contract.write.mint([
        walletClient.account.address,
        parseUnits("100", 18),
    ]);

    return {
        templateAddress,
        customContracts: [
            {
                name: "Trusted arbitrator",
                address: arbitratorAddress,
            },
            {
                name: "ERC20 1",
                address: tst1Address,
            },
            {
                name: "ERC20 2",
                address: tst2Address,
            },
        ],
        frontendGlobals: {
            CCT_TRUSTED_ARBITRATOR_ADDRESS: arbitratorAddress,
            CCT_ERC20_1_ADDRESS: tst1Address,
            CCT_ERC20_2_ADDRESS: tst2Address,
        },
    };
};
