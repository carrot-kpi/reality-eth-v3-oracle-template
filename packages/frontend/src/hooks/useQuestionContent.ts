import { useIPFSGatewayURL } from "@carrot-kpi/react";
import { Fetcher } from "@carrot-kpi/sdk";
import { useEffect, useState } from "react";

export function useQuestionContent(cid?: string) {
    const ipfsGatewayURL = useIPFSGatewayURL();

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    useEffect(() => {
        if (!cid) return;
        let cancelled = false;
        const fetchData = async () => {
            try {
                if (!cancelled) setLoading(true);
                const content = (
                    await Fetcher.fetchContentFromIPFS({
                        cids: [cid],
                        ipfsGatewayURL,
                    })
                )[cid];
                if (!cancelled) setContent(content);
            } catch (error) {
                console.warn(
                    `could not get question content from raw content ${cid}`,
                    error,
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void fetchData();
        return () => {
            cancelled = true;
        };
    }, [ipfsGatewayURL, cid]);

    return { loading, content };
}
