import { ChainId } from "@carrot-kpi/sdk";
import { execSync } from "child_process";
import { Contract, ContractFactory, utils } from "ethers";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(fileURLToPath(import.meta.url));

const wrappedNativeCurrencyAbi = require("./abis/native-currency-wrapper.json");
const WRAPPED_NATIVE_CURRENCY_ADDRESS = {
    [ChainId.GOERLI]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // weth
    [ChainId.SEPOLIA]: "0xa5ba8636a78bbf1910430d0368c0175ef5a1845b", // weth
    [ChainId.GNOSIS]: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d", // wxdai
};

export const setupFork = async (
    factory,
    kpiTokensManager,
    _oraclesManager,
    _multicall,
    predictedTemplateId,
    signer
) => {
    const chainId = await signer.getChainId();
    execSync(
        `node ./packages/contracts/codegen-chain-specific-contracts.js ${chainId}`,
        { stdio: "ignore" }
    );
    execSync("yarn build:contracts", { stdio: "ignore" });

    // deploy template
    const {
        abi: templateAbi,
        bytecode: templateBytecode,
    } = require(`../out/RealityV3Oracle${chainId}.sol/RealityV3Oracle.json`);
    const templateFactory = new ContractFactory(
        templateAbi,
        templateBytecode,
        signer
    );
    const templateContract = await templateFactory.deploy();
    await templateContract.deployed();

    // deploy arbitrator
    const {
        abi: arbitratorAbi,
        bytecode: arbitratorBytecode,
    } = require(`../out/TrustedRealityV3Arbitrator${chainId}.sol/TrustedRealityV3Arbitrator.json`);
    const arbitratorFactory = new ContractFactory(
        arbitratorAbi,
        arbitratorBytecode,
        signer
    );
    const arbitratorContract = await arbitratorFactory.deploy("{}", 0);
    await arbitratorContract.deployed();

    // give us some wrapped native currency too
    await new Contract(
        WRAPPED_NATIVE_CURRENCY_ADDRESS[chainId],
        wrappedNativeCurrencyAbi,
        signer
    ).deposit({
        value: utils.parseEther("1"),
    });

    return {
        templateContract,
        customContracts: [
            {
                name: "Trusted arbitrator",
                address: arbitratorContract.address,
            },
            {
                name: "ERC20 1",
                address: testToken1Contract.address,
            },
            {
                name: "ERC20 2",
                address: testToken2Contract.address,
            },
        ],
        frontendGlobals: {
            CCT_ERC20_1_ADDRESS: testToken1Contract.address,
            CCT_ERC20_2_ADDRESS: testToken2Contract.address,
            CCT_TRUSTED_ARBITRATOR_ADDRESS: arbitratorContract.address,
        },
    };
};
