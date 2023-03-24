import { useIPFSGatewayURL } from "@carrot-kpi/react";
import { CoreFetcher } from "@carrot-kpi/sdk";
import { useEffect, useState } from "react";

export const useQuestionContent = (rawContent?: string) => {
    const ipfsGatewayURL = useIPFSGatewayURL();

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");

    useEffect(() => {
        if (!rawContent) return;
        let cancelled = false;
        const fetchData = async () => {
            try {
                if (!cancelled) setLoading(true);
                const splitContent = rawContent.split("-");
                if (splitContent.length < 2) return;
                const cid = splitContent[0];
                const content = (
                    await CoreFetcher.fetchContentFromIPFS({
                        cids: [cid],
                        ipfsGatewayURL,
                    })
                )[cid];
                if (!cancelled) setContent(content);
            } catch (error) {
                console.warn(
                    `could not get question content from raw content ${rawContent}`,
                    error
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void fetchData();
        return () => {
            cancelled = true;
        };
    }, [ipfsGatewayURL, rawContent]);

    return { loading, content };
};
