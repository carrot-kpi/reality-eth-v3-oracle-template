import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@carrot-kpi/switzer-font/400.css";
import "@carrot-kpi/switzer-font/500.css";
import "@carrot-kpi/switzer-font/700.css";
import "@carrot-kpi/ui/styles.css";
import "@carrot-kpi/host-frontend/styles.css";

import { CarrotConnector, Root } from "@carrot-kpi/host-frontend";
import { createRoot } from "react-dom/client";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { Connector } from "wagmi";
import * as chains from "wagmi/chains";

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
        getAdditionalConnectors={() => [
            new CarrotConnector({
                chains: supportedChains,
                options: {
                    rpcURL: CCT_RPC_URL,
                    chainId: CCT_CHAIN_ID,
                    privateKey: CCT_DEPLOYMENT_ACCOUNT_PRIVATE_KEY,
                },
            }) as Connector,
        ]}
        ipfsGatewayURL={CCT_IPFS_GATEWAY_URL}
        oracleTemplateBaseURL={CCT_TEMPLATE_URL}
    />
);
