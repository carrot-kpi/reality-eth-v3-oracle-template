import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import {
    Button,
    Markdown,
    NumberInput,
    Select,
    SelectOption,
    Timer,
    Typography,
} from "@carrot-kpi/ui";
import { BigNumber, utils } from "ethers";
import { parseUnits } from "ethers/lib/utils.js";
import {
    ChangeEvent,
    ReactElement,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { Address } from "wagmi";
import { SupportedRealityTemplates } from "../../../commons";
import { usePostRealityAnswer } from "../../../hooks/usePostRealityAnswer";
import { numberToByte32 } from "../../../utils";
import { NumberFormatValue, RealityQuestion } from "../../types";
import { Answer } from "../answer";

interface AnswerFormProps {
    t: NamespacedTranslateFunction;
    currentAnswerInvalid?: boolean;
    realityQuestionOpen?: boolean;
    realityTemplateType?: SupportedRealityTemplates;
    realityQuestion: RealityQuestion;
    questionContent: string;
}

export const AnswerForm = ({
    t,
    currentAnswerInvalid,
    realityQuestionOpen,
    realityTemplateType,
    realityQuestion,
    questionContent,
}: AnswerFormProps): ReactElement => {
    const [booleanValue, setBooleanValue] = useState<SelectOption | null>(null);
    const [numberValue, setNumberValue] = useState("");
    const [finalAnswer, setFinalAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const { defaultBondValue, defaultFormatteBondValue } = useMemo(() => {
        const defaultValue = realityQuestion.bond.isZero()
            ? utils.formatUnits(realityQuestion.minBond.toString(), 18)
            : utils.formatUnits(realityQuestion.bond.toString(), 18);
        const defaultFormattedValue = !!defaultValue
            ? utils.commify(defaultValue)
            : "";
        return {
            defaultBondValue: defaultValue,
            defaultFormatteBondValue: defaultFormattedValue,
        };
    }, [realityQuestion.bond, realityQuestion.minBond]);

    const [bond, setBond] = useState<NumberFormatValue>({
        value: defaultBondValue,
        formattedValue: defaultFormatteBondValue,
    });

    const { postAnswerAsync } = usePostRealityAnswer(
        bond.value,
        finalAnswer,
        realityQuestion.id
    );

    const submitEnabled = useMemo(() => {
        if (realityTemplateType === SupportedRealityTemplates.BOOL)
            return !!booleanValue;
        if (realityTemplateType === SupportedRealityTemplates.UINT)
            return !!numberValue;
        return false;
    }, [realityTemplateType, booleanValue, numberValue]);

    const minimumBond = useMemo(() => {
        if (realityQuestion.bond) return realityQuestion.bond.mul(2);
        return realityQuestion.minBond;
    }, [realityQuestion.bond, realityQuestion.minBond]);

    useEffect(() => {
        if (booleanValue)
            setFinalAnswer(
                numberToByte32(booleanValue.value.toString()) as Address
            );
        if (numberValue) setFinalAnswer(parseUnits(numberValue, 18).toString());
    }, [booleanValue, numberValue]);

    const handleNumberValueChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setNumberValue(event.target.value);
        },
        []
    );

    const handleBondChange = useCallback(
        (value: NumberFormatValue) => {
            if (!!value.value && BigNumber.from(value.value).lt(minimumBond))
                return;

            setBond(value);
        },
        [minimumBond]
    );

    const handleSubmit = useCallback(() => {
        if (!postAnswerAsync) return;
        let cancelled = false;
        const submit = async () => {
            if (!cancelled) setSubmitting(true);
            try {
                const tx = await postAnswerAsync();
                await tx.wait();
                if (cancelled) return;
            } catch (error) {
                console.error("error submitting answer to reality v3", error);
            } finally {
                if (!cancelled) setSubmitting(false);
            }
        };
        void submit();
        return () => {
            cancelled = true;
        };
    }, [postAnswerAsync]);

    if (realityQuestion.pendingArbitration) return <></>;

    return (
        <div className="flex flex-col gap-6">
            {!!realityQuestionOpen ? (
                <>
                    <Markdown>{questionContent}</Markdown>
                    <Typography weight="medium">
                        {t("label.reward", {
                            reward: realityQuestion.bounty.toString(),
                        })}
                    </Typography>
                    {realityTemplateType === SupportedRealityTemplates.BOOL && (
                        <Select
                            id="bool-template"
                            label={t("label.question.form.answer")}
                            value={booleanValue}
                            onChange={setBooleanValue}
                            options={[
                                { label: "Yes", value: 1 },
                                { label: "No", value: 0 },
                            ]}
                        />
                    )}
                    {realityTemplateType === SupportedRealityTemplates.UINT && (
                        <NumberInput
                            id="uint-template"
                            label={t("label.question.form.answer")}
                            value={numberValue}
                            onChange={handleNumberValueChange}
                        />
                    )}
                    <NumberInput
                        id="bond"
                        placeholder={"0.0"}
                        label={t("label.question.form.bond")}
                        value={bond.formattedValue}
                        onValueChange={handleBondChange}
                    />
                    <Answer
                        t={t}
                        currentAnswerInvalid={!!currentAnswerInvalid}
                        realityQuestionBond={realityQuestion.bond}
                        realityTemplateType={realityTemplateType}
                        realityAnswer={BigNumber.from(
                            realityQuestion.bestAnswer
                        )}
                    />
                </>
            ) : (
                <>
                    <Typography>{t("label.question.notOpen")}</Typography>
                    <div className="flex gap-2">
                        <Typography>{t("label.question.openingIn")}</Typography>
                        <Timer
                            icon={true}
                            to={realityQuestion.openingTimestamp * 1_000}
                            countdown={true}
                        />
                    </div>
                </>
            )}
            <Button
                onClick={handleSubmit}
                disabled={!submitEnabled}
                loading={submitting}
            >
                {t("label.question.form.confirm")}
            </Button>
        </div>
    );
};
