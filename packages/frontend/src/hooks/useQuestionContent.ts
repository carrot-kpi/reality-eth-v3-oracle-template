import { CoreFetcher } from "@carrot-kpi/sdk";
import { useEffect, useState } from "react";

export function useQuestionContent(cid: string | undefined): {
    loading: boolean;
    data: string | undefined;
} {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<string>();

    useEffect(() => {
        let cancelled = false;
        const fetchData = async (): Promise<void> => {
            if (!cid) return;
            if (!cancelled) setLoading(true);

            try {
                const questionContent = await CoreFetcher.fetchContentFromIPFS({
                    cids: [cid],
                });

                if (!cancelled) setData(questionContent[cid]);
            } catch (error) {
                console.error(
                    "error fetching question content from ipfs",
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
    }, [cid]);

    return { loading, data };
}
