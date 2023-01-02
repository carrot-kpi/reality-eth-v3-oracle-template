import {
    CarrotCoreProvider,
    CreationForm,
    useOracleTemplates,
} from "@carrot-kpi/react";
import { CarrotUIProvider } from "@carrot-kpi/ui";
import { ReactElement, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Wallet, providers, Signer, BigNumber } from "ethers";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import {
    Address,
    Connector,
    ConnectorData,
    useAccount,
    useConnect,
} from "wagmi";
import { Chain } from "wagmi/chains";
import * as chains from "wagmi/chains";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@carrot-kpi/ui/styles.css";

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async watchAsset(asset: {
        address: string;
        decimals?: number;
        image?: string;
        symbol: string;
    }): Promise<boolean> {
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

i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

const forkedChain = Object.values(chains).find(
    (chain) => chain.id === CCT_CHAIN_ID
);
if (!forkedChain) {
    console.log(`unsupported chain id ${CCT_CHAIN_ID}`);
    process.exit(0);
}
const supportedChains = [forkedChain];

const App = (): ReactElement => {
    const cctTemplateIds = useMemo(() => [CCT_TEMPLATE_ID], []);

    const { isConnected } = useAccount();
    const { connect, connectors } = useConnect({
        chainId: CCT_CHAIN_ID,
    });
    const { loading: isLoadingTemplates, templates } =
        useOracleTemplates(cctTemplateIds);
    // const { loading: isLoadingKpiTokens, kpiTokens } = useKpiTokens()

    useEffect(() => {
        if (!isConnected) connect({ connector: connectors[0] });
    }, [connect, connectors, isConnected]);

    const handleDone = (to: Address, data: string, value: BigNumber): void => {
        console.log(to, data, value.toString());
    };

    return (
        <div className="h-screen">
            {!isLoadingTemplates && (
                <CreationForm
                    i18n={i18next}
                    fallback={<>Loading...</>}
                    template={templates[0]}
                    customBaseUrl={"http://localhost:9002/"}
                    onDone={handleDone}
                />
            )}
            {/* <h2>Page</h2>
      {!isLoadingKpiTokens &&
        Object.values(kpiTokens).map((kpiToken) => (
          <div key={kpiToken.address}>
            <Campaign
              address={kpiToken.address}
              customBaseUrl={`${CCT_IPFS_GATEWAY_URL}/${kpiToken.template.specification.cid}`}
            />
          </div>
        ))} */}
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
    <CarrotCoreProvider
        supportedChains={supportedChains}
        providers={[
            jsonRpcProvider({
                rpc: () => ({
                    http: CCT_RPC_URL,
                }),
            }),
        ]}
        getConnectors={(chains: Chain[]) => [
            new CarrotConnector({ chains, options: {} }) as Connector,
        ]}
        ipfsGateway={CCT_IPFS_GATEWAY_URL}
    >
        <CarrotUIProvider>
            <App />
        </CarrotUIProvider>
    </CarrotCoreProvider>
);
