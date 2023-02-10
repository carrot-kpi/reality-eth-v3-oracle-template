import { utils, ContractFactory } from "ethers";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const require = createRequire(fileURLToPath(import.meta.url));

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
