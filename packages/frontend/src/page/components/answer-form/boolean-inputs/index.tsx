import { Radio, RadioGroup, Typography } from "@carrot-kpi/ui";
import { BooleanAnswer } from "../../../../commons";
import { infoPopoverStyles, inputStyles } from "../common/styles";
import type { NamespacedTranslateFunction } from "@carrot-kpi/react";
import type { FormEventHandler } from "react";

interface BooleanInputsProps {
    t: NamespacedTranslateFunction;
    answer: BooleanAnswer | null;
    disabled: boolean;
    onChange: FormEventHandler<HTMLElement>;
}

export const BooleanInputs = ({
    t,
    answer,
    disabled,
    onChange,
}: BooleanInputsProps) => {
    return (
        <div className="flex flex-col gap-4">
            <RadioGroup
                id="bool-template"
                className={{
                    radioInputsWrapper:
                        "flex flex-col gap-8 md:flex-row md:gap-11",
                }}
            >
                <Radio
                    id="bool-template-yes"
                    name="bool-answer"
                    label={t("label.question.form.yes")}
                    value={BooleanAnswer.YES}
                    checked={answer === BooleanAnswer.YES}
                    disabled={disabled}
                    onChange={onChange}
                    className={{
                        inputWrapper: inputStyles({
                            disabled: disabled,
                        }),
                    }}
                />
                <Radio
                    id="bool-template-no"
                    name="bool-answer"
                    label={t("label.question.form.no")}
                    value={BooleanAnswer.NO}
                    checked={answer === BooleanAnswer.NO}
                    disabled={disabled}
                    onChange={onChange}
                    className={{
                        inputWrapper: inputStyles({
                            disabled: disabled,
                        }),
                    }}
                />
                <Radio
                    id="bool-template-invalid"
                    name="bool-answer"
                    label={t("label.question.form.invalid")}
                    info={
                        <Typography variant="sm">
                            {t("invalid.info")}
                        </Typography>
                    }
                    value={BooleanAnswer.INVALID_REALITY_ANSWER}
                    checked={answer === BooleanAnswer.INVALID_REALITY_ANSWER}
                    disabled={disabled}
                    onChange={onChange}
                    className={{
                        infoPopover: infoPopoverStyles(),
                        inputWrapper: inputStyles({
                            disabled: disabled,
                        }),
                    }}
                />
                <Radio
                    id="bool-template-too-soon"
                    name="bool-answer"
                    label={t("label.question.form.tooSoon")}
                    info={
                        <Typography variant="sm">
                            {t("tooSoon.info")}
                        </Typography>
                    }
                    value={BooleanAnswer.ANSWERED_TOO_SOON_REALITY_ANSWER}
                    checked={
                        answer ===
                        BooleanAnswer.ANSWERED_TOO_SOON_REALITY_ANSWER
                    }
                    disabled={disabled}
                    onChange={onChange}
                    className={{
                        infoPopover: infoPopoverStyles(),
                        inputWrapper: inputStyles({
                            disabled: disabled,
                        }),
                    }}
                />
            </RadioGroup>
        </div>
    );
};
