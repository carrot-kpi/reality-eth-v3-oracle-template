import { enforce, Oracle } from "@carrot-kpi/sdk";
import { ReactElement, useMemo } from "react";
import { NamespacedTranslateFunction, useWatchData } from "@carrot-kpi/react";
import { defaultAbiCoder } from "ethers/lib/utils.js";
import { useWatchRealityQuestion } from "../hooks/useWatchRealityQuestion";
import { Loader, Typography } from "@carrot-kpi/ui";
import { useRealityAnswer } from "../hooks/useRealityAnswer";
import { useDecentralizedStorageContent } from "../hooks/useDecentralizedStorageContent";
import { INVALID_REALITY_ANSWER, SupportedRealityTemplates } from "../commons";
import { PendingArbitration } from "./components/pending-arbitration";
import { AnswerForm } from "./components/answer-form";

interface PageProps {
    t: NamespacedTranslateFunction;
    oracle: Oracle;
}

export const Component = ({ t, oracle }: PageProps): ReactElement => {
    const { loading: loadingData, data } = useWatchData(oracle.address);

    const { questionId, question } = useMemo(() => {
        if (!data) return {};

        const [realityV3Address, questionId, question] = defaultAbiCoder.decode(
            ["address", "bytes32", "string"],
            data
        ) as [string, string, string];

        return {
            realityV3Address,
            questionId,
            question,
        };
    }, [data]);

    const [questionContentCid, templateType] = useMemo(() => {
        if (!question) return [undefined, undefined];
        const [questionContentCid, templateId] = question.split("-");
        const numericTemplateId = parseInt(
            templateId
        ) as SupportedRealityTemplates;

        enforce(
            numericTemplateId in SupportedRealityTemplates,
            "reality template id not supported"
        );

        return [questionContentCid, numericTemplateId];
    }, [question]);

    const { loading: loadingRealityQuestion, question: realityQuestion } =
        useWatchRealityQuestion(questionId, question);
    const { loading: loadingRealityAnswer, data: realityAnswer } =
        useRealityAnswer(questionId);
    const { loading: loadingQuestionContent, data: questionContent } =
        useDecentralizedStorageContent(questionContentCid);

    const currentAnswerInvalid = useMemo(() => {
        if (!realityQuestion) return;
        if (!realityAnswer) return;

        return (
            !realityQuestion.bond.isZero() &&
            realityAnswer.eq(INVALID_REALITY_ANSWER)
        );
    }, [realityQuestion, realityAnswer]);

    const realityQuestionOpen = useMemo(() => {
        if (!realityQuestion) return;
        return realityQuestion.openingTimestamp < new Date().getTime() / 1000;
    }, [realityQuestion]);

    if (
        loadingData ||
        loadingRealityAnswer ||
        loadingQuestionContent ||
        !questionContent
    ) {
        return (
            <div className="flex justify-center content-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 p-3 rounded-xxl border border-black dark:border-white bg-white dark:bg-black">
                <Typography>{t("label.question.info")}</Typography>
                <Typography>
                    {t("label.question.realityReference")}{" "}
                    <a
                        href="https://reality.eth.limo/app/docs/html/index.html"
                        className="font-mono text-orange"
                    >
                        {t("label.here")}
                    </a>
                    .
                </Typography>
            </div>

            <div className="flex flex-col gap-3 p-3 rounded-xxl border border-black dark:border-white bg-white dark:bg-black">
                <PendingArbitration t={t} realityQuestion={realityQuestion} />

                {loadingRealityQuestion || !realityQuestion ? (
                    <div className="flex justify-center content-center">
                        <Loader />
                    </div>
                ) : (
                    <AnswerForm
                        t={t}
                        currentAnswerInvalid={currentAnswerInvalid}
                        realityQuestionOpen={realityQuestionOpen}
                        realityTemplateType={templateType}
                        realityQuestion={realityQuestion}
                        questionContent={questionContent}
                    />
                )}
            </div>
        </div>
    );
};
