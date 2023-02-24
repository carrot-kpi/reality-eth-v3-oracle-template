import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "@carrot-kpi/ui/styles.css";
import "@carrot-kpi/frontend/styles.css";
import "./global.css";

import { Root } from "@carrot-kpi/frontend";
import { createRoot } from "react-dom/client";
import { Wallet, providers, Signer } from "ethers";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { Address, Connector, ConnectorData } from "wagmi";
import { Chain } from "wagmi/chains";
import * as chains from "wagmi/chains";

class CarrotConnector extends Connector<
    providers.JsonRpcProvider,
    unknown,
    Signer
> {
    readonly id = "carrot";
    readonly name = "Carrot";
    readonly ready = true;

    private readonly provider: providers.JsonRpcProvider;
    private readonly signer: Signer;

    constructor(config: { chains: Chain[]; options: object }) {
        super(config);
        this.provider = new providers.JsonRpcProvider(CCT_RPC_URL);
        this.signer = new Wallet(CCT_DEPLOYMENT_ACCOUNT_PRIVATE_KEY).connect(
            this.provider
        );
    }

    async connect({} = {}): Promise<Required<ConnectorData>> {
        this.emit("message", { type: "connecting" });

        const data = {
            account: (await this.signer.getAddress()) as Address,
            chain: { id: CCT_CHAIN_ID, unsupported: false },
            provider: this.provider,
        };

        return data;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async disconnect(): Promise<void> {}

    async getAccount(): Promise<Address> {
        return (await this.signer.getAddress()) as Address;
    }

    async getChainId(): Promise<number> {
        return CCT_CHAIN_ID;
    }

    async getProvider({} = {}): Promise<providers.JsonRpcProvider> {
        return this.provider;
    }

    async getSigner(): Promise<Signer> {
        return this.signer;
    }

    async isAuthorized(): Promise<boolean> {
        return true;
    }

    async watchAsset({} = {}): Promise<boolean> {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected onAccountsChanged = (): void => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected onChainChanged = (): void => {};

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    protected onDisconnect = (): void => {};

    toJSON(): string {
        return "<CarrotConnector>";
    }
}

const forkedChain = Object.values(chains).find(
    (chain) => chain.id === CCT_CHAIN_ID
);
if (!forkedChain) {
    console.log(`unsupported chain id ${CCT_CHAIN_ID}`);
    process.exit(0);
}
const supportedChains = [forkedChain];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
    <Root
        supportedChains={supportedChains}
        providers={[
            jsonRpcProvider({
                rpc: () => ({
                    http: CCT_RPC_URL,
                }),
            }),
        ]}
        connectors={() => [
            new CarrotConnector({
                chains: supportedChains,
                options: {},
            }) as Connector,
        ]}
        ipfsGatewayURL={CCT_IPFS_GATEWAY_URL}
        oracleTemplateBaseURL="http://localhost:9002"
    />
);
