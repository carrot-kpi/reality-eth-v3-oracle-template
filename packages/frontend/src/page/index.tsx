import { Oracle } from "@carrot-kpi/sdk";
import { ReactElement, useMemo } from "react";
import {
    NamespacedTranslateFunction,
    useNativeCurrency,
    useWatchData,
} from "@carrot-kpi/react";
import { defaultAbiCoder, formatUnits } from "ethers/lib/utils.js";
import { useRealityQuestion } from "../hooks/useRealityQuestion";
import { Loader, Markdown, Timer, Typography } from "@carrot-kpi/ui";
import { useRealityAnswer } from "../hooks/useRealityAnswer";
import { INVALID_REALITY_ANSWER } from "./types";
import { useQuestionContent } from "../hooks/useQuestionContent";

interface PageProps {
    t: NamespacedTranslateFunction;
    oracle: Oracle;
}

export const Component = ({ t, oracle }: PageProps): ReactElement => {
    const { /* loading: loadingData, */ data } = useWatchData(oracle.address);
    const nativeCurrency = useNativeCurrency();

    const { questionId, question } = useMemo(() => {
        if (!data) return {};

        const [
            realityV3Address,
            questionId,
            arbitratorAddress,
            question,
            timeout,
            openingTimestamp,
        ] = defaultAbiCoder.decode(
            ["address", "bytes32", "address", "string", "uint32", "uint32"],
            data
        ) as [string, string, string, string, number, number];

        return {
            realityV3Address,
            questionId,
            arbitratorAddress,
            question,
            timeout,
            openingTimestamp,
        };
    }, [data]);

    const { loading: loadingRealityQuestion, data: realityQuestion } =
        useRealityQuestion(questionId);
    const { loading: loadingRealityAnswer, data: realityAnswer } =
        useRealityAnswer(questionId);
    const { loading: loadingQuestionContent, data: questionContent } =
        useQuestionContent(question);

    const currentAnswerInvalid = useMemo(() => {
        if (!realityQuestion) return;
        if (!realityAnswer) return;

        return (
            !realityQuestion.bond.isZero() &&
            realityAnswer.eq(INVALID_REALITY_ANSWER)
        );
    }, [realityQuestion, realityAnswer]);

    if (
        loadingRealityQuestion ||
        loadingRealityAnswer ||
        loadingQuestionContent ||
        !realityQuestion ||
        !questionContent
    ) {
        return <Loader />;
    }

    if (realityQuestion.pendingArbitration) {
        return (
            <div className="flex flex-col gap-3 p-3 rounded-xxl border border-black dark:border-white bg-white dark:bg-black">
                <Typography>
                    {t("label.arbitration.peding.start")}{" "}
                    {/* TODO: add link to explorer based on chain */}
                    <a className="font-mono text-orange">
                        {realityQuestion.arbitrator}
                    </a>{" "}
                    {t("label.arbitration.peding.end")}
                </Typography>
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
                {realityQuestion.openingTimestamp >
                new Date().getTime() / 1000 ? (
                    <>
                        <Typography>{t("label.question.notOpen")}</Typography>
                        <div className="flex gap-2">
                            <Typography>
                                {t("label.question.openingIn")}
                            </Typography>
                            <Timer
                                to={realityQuestion.openingTimestamp * 1000}
                                countdown
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <Markdown>{questionContent}</Markdown>
                        <Typography weight="medium">
                            {t("label.reward", {
                                reward: realityQuestion.bounty.toString(),
                            })}
                        </Typography>
                        <Typography>
                            {realityQuestion.bond.isZero()
                                ? "No answer submitted yet"
                                : !!currentAnswerInvalid
                                ? `Goal currently market as invalid with ${formatUnits(
                                      realityQuestion.bond,
                                      nativeCurrency.decimals
                                  )} ${nativeCurrency.symbol} bonded`
                                : ""}
                        </Typography>
                    </>
                )}
            </div>
        </div>
    );
};
