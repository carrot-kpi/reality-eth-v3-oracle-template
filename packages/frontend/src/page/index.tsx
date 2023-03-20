import "../global.css";

import { ReactElement, useEffect, useState } from "react";
import { OraclePageProps, useWatchData } from "@carrot-kpi/react";
import { useWatchRealityQuestion } from "../hooks/useWatchRealityQuestion";
import { Loader } from "@carrot-kpi/ui";
import { AnswerForm } from "./components/answer-form";
import { decodeOracleData } from "../utils/data-decoding";

export const Component = ({
    t,
    oracle,
    onTx,
}: OraclePageProps): ReactElement => {
    const { loading: loadingData, data } = useWatchData(oracle?.address);

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

    if (!oracle || loadingData || !realityQuestion) {
        return (
            <div className="flex justify-center content-center px-3 py-6">
                <Loader />
            </div>
        );
    }
    if (loadingRealityQuestion && !realityQuestion) {
        return (
            <div className="flex justify-center content-center px-3 py-6">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 px-6 py-12">
            <AnswerForm
                t={t}
                realityAddress={realityV3Address}
                oracle={oracle}
                loadingQuestion={loadingRealityQuestion}
                question={realityQuestion}
                onTx={onTx}
            />
        </div>
    );
};
