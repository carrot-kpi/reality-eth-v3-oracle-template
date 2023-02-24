import { utils, ContractFactory, Contract } from "ethers";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { ChainId } from "@carrot-kpi/sdk";

const require = createRequire(fileURLToPath(import.meta.url));

const wethAbi = require("./abis/weth.json");
const WETH_ADDRESS = {
    [ChainId.GOERLI]: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    [ChainId.SEPOLIA]: "0xa5ba8636a78bbf1910430d0368c0175ef5a1845b",
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
        { stdio: "inherit" }
    );
    execSync("yarn build:contracts", { stdio: "inherit" });

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

    // deploy test erc20 tokens
    const {
        abi: erc20Abi,
        bytecode: erc20Bytecode,
    } = require("../out/ERC20PresetMinterPauser.sol/ERC20PresetMinterPauser.json");
    const erc20Factory = new ContractFactory(erc20Abi, erc20Bytecode, signer);
    const testToken1Contract = await erc20Factory.deploy(
        "Test token 1",
        "TST1"
    );
    await testToken1Contract.deployed();
    const testToken2Contract = await erc20Factory.deploy(
        "Test token 2",
        "TST2"
    );
    await testToken2Contract.deployed();

    // mint some test erc20 tokens to signer
    await testToken1Contract.mint(signer.address, utils.parseUnits("100", 18));
    await testToken2Contract.mint(signer.address, utils.parseUnits("100", 18));

    // give us some weth too
    await new Contract(WETH_ADDRESS[chainId], wethAbi, signer).deposit({
        value: utils.parseEther("0.01"),
    });

    return {
        templateContract,
        customContracts: [
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
        },
    };
};
