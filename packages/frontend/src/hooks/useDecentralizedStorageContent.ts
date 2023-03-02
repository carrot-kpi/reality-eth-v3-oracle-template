import { useIPFSGatewayURL } from "@carrot-kpi/react";
import { CoreFetcher } from "@carrot-kpi/sdk";
import { useEffect, useState } from "react";

// TODO: move to @carrot-kpi/react package
export function useDecentralizedStorageContent(cid?: string): {
    loading: boolean;
    data: string | null;
} {
    const ipfsGatewayURL = useIPFSGatewayURL();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!cid) return;
            if (!cancelled) setLoading(true);

            try {
                const questionContent = await CoreFetcher.fetchContentFromIPFS({
                    ipfsGatewayURL,
                    cids: [cid],
                });

                if (!cancelled) setData(questionContent[cid]);
            } catch (error) {
                console.error(
                    "error fetching content from decentralized storage",
                    error
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => {
            cancelled = true;
        };
    }, [ipfsGatewayURL, cid]);

    return { loading, data };
}
