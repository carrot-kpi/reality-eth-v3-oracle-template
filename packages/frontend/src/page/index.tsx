import "../global.css";

import { Oracle } from "@carrot-kpi/sdk";
import { ReactElement, useEffect, useState } from "react";
import { NamespacedTranslateFunction, useWatchData } from "@carrot-kpi/react";
import { useWatchRealityQuestion } from "../hooks/useWatchRealityQuestion";
import { Loader } from "@carrot-kpi/ui";
import { PendingArbitration } from "./components/pending-arbitration";
import { AnswerForm } from "./components/answer-form";
import { decodeOracleData } from "../utils/data-decoding";

interface PageProps {
    t: NamespacedTranslateFunction;
    oracle: Oracle;
}

export const Component = ({ t, oracle }: PageProps): ReactElement => {
    const { loading: loadingData, data } = useWatchData(oracle.address);

    const [realityV3Address, setRealityV3Address] = useState("");
    const [questionId, setQuestionId] = useState("");
    const [question, setQuestion] = useState("");

    useEffect(() => {
        if (!data) return;
        const decoded = decodeOracleData(data);
        if (!decoded) return;
        setRealityV3Address(decoded.realityV3Address);
        setQuestionId(decoded.questionId);
        setQuestion(decoded.question);
    }, [data]);

    const { loading: loadingRealityQuestion, question: realityQuestion } =
        useWatchRealityQuestion(realityV3Address, questionId, question);

    if (loadingData || !realityQuestion) {
        return (
            <div className="flex justify-center content-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 px-6 py-12">
            <>
                {realityQuestion.pendingArbitration ? (
                    <PendingArbitration
                        t={t}
                        realityQuestion={realityQuestion}
                    />
                ) : (
                    <AnswerForm
                        t={t}
                        realityAddress={realityV3Address}
                        loadingQuestion={loadingRealityQuestion}
                        question={realityQuestion}
                    />
                )}
            </>
        </div>
    );
};
