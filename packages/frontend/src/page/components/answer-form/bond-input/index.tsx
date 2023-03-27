import { NumberFormatValue } from "../../../types";
import { NumberInput, Typography } from "@carrot-kpi/ui";
import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { infoPopoverStyles, inputStyles } from "../common/styles";
import { useNetwork } from "wagmi";

interface BondInputProps {
    t: NamespacedTranslateFunction;
    disabled?: boolean;
    value: NumberFormatValue;
    placeholder?: string;
    errorText?: string;
    onChange: (value: NumberFormatValue) => void;
}

export const BondInput = ({
    t,
    disabled,
    value,
    placeholder,
    errorText,
    onChange,
}: BondInputProps) => {
    const { chain } = useNetwork();

    return (
        <NumberInput
            id="bond"
            label={t("label.question.form.bond", {
                symbol: chain?.nativeCurrency.symbol,
            })}
            info={
                <>
                    <Typography variant="sm" className={{ root: "mb-2" }}>
                        {t("bond.info.1")}
                    </Typography>
                    <Typography variant="sm" className={{ root: "mb-2" }}>
                        {t("bond.info.2")}
                    </Typography>
                    <Typography variant="sm">{t("bond.info.3")}</Typography>
                </>
            }
            placeholder={placeholder || "0.0"}
            allowNegative={false}
            min={0}
            value={value.formattedValue}
            errorText={errorText}
            error={!!errorText}
            disabled={disabled}
            onValueChange={onChange}
            className={{
                root: "w-fit",
                input: "w-fit",
                infoPopover: infoPopoverStyles(),
                labelText: { root: "text-sm" },
                inputWrapper: inputStyles({
                    disabled,
                }),
            }}
        />
    );
};
