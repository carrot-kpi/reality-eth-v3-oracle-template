import {
    Checkbox,
    NumberInput,
    Typography,
    type NumberInputProps,
} from "@carrot-kpi/ui";
import { infoPopoverStyles, inputStyles } from "../common/styles";
import type { NamespacedTranslateFunction } from "@carrot-kpi/react";
import type { FormEventHandler } from "react";
import type { NumberFormatValue } from "../../../types";

interface ScalarInputsProps {
    t: NamespacedTranslateFunction;
    scalarAnswer: NumberFormatValue;
    moreOptionsAnswer: {
        invalid: boolean;
        anweredTooSoon: boolean;
    };
    scalarDisabled: boolean;
    onScalarAnswerChange: NumberInputProps["onValueChange"];
    onInvalidChange: FormEventHandler<HTMLElement>;
    onAnsweredTooSoonChange: FormEventHandler<HTMLElement>;
}

export const ScalarInputs = ({
    t,
    scalarAnswer,
    moreOptionsAnswer,
    scalarDisabled,
    onScalarAnswerChange,
    onInvalidChange,
    onAnsweredTooSoonChange,
}: ScalarInputsProps) => {
    return (
        <div className="flex flex-col lg:items-center lg:flex-row gap-8">
            <NumberInput
                id="uint-template"
                placeholder={"0.0"}
                allowNegative={false}
                min={0}
                value={scalarAnswer.formattedValue}
                disabled={scalarDisabled}
                onValueChange={onScalarAnswerChange}
                className={{
                    inputWrapper: inputStyles({
                        disabled: scalarDisabled,
                    }),
                }}
            />
            <Checkbox
                id="invalid"
                label={t("label.question.form.invalid")}
                info={<Typography variant="sm">{t("invalid.info")}</Typography>}
                checked={moreOptionsAnswer.invalid}
                onChange={onInvalidChange}
                className={{
                    infoPopover: infoPopoverStyles(),
                    inputWrapper: inputStyles({
                        disabled: moreOptionsAnswer.anweredTooSoon,
                        full: false,
                    }),
                }}
            />
            <Checkbox
                id="too-soon"
                label={t("label.question.form.tooSoon")}
                info={<Typography variant="sm">{t("tooSoon.info")}</Typography>}
                checked={moreOptionsAnswer.anweredTooSoon}
                onChange={onAnsweredTooSoonChange}
                className={{
                    infoPopover: infoPopoverStyles(),
                    inputWrapper: inputStyles({
                        disabled: moreOptionsAnswer.invalid,
                        full: false,
                    }),
                }}
            />
        </div>
    );
};
