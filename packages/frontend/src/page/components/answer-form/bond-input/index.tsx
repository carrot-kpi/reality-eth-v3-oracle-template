import { useCallback } from "react";
import { NumberFormatValue } from "../../../types";
import { NumberInput } from "@carrot-kpi/ui";
import {
    NamespacedTranslateFunction,
    useNativeCurrency,
} from "@carrot-kpi/react";
import { BigNumber, utils } from "ethers";
import { inputStyles } from "../common/styles";

interface BondInputProps {
    t: NamespacedTranslateFunction;
    disabled?: boolean;
    value: BigNumber | null;
    placeholder?: string;
    errorText?: string;
    onChange: (value: BigNumber) => void;
}

export const BondInput = ({
    t,
    disabled,
    value,
    placeholder,
    errorText,
    onChange,
}: BondInputProps) => {
    const nativeCurrency = useNativeCurrency();

    const handleChange = useCallback(
        (value: NumberFormatValue) => {
            const bond = value.value
                ? utils.parseUnits(value.value, nativeCurrency.decimals)
                : BigNumber.from("0");
            onChange(bond);
        },
        [nativeCurrency, onChange]
    );

    return (
        <NumberInput
            id="bond"
            label={t("label.question.form.bond")}
            placeholder={placeholder || "0.0"}
            allowNegative={false}
            min={0}
            value={
                value ? utils.formatUnits(value, nativeCurrency.decimals) : null
            }
            helperText={errorText}
            error={!!errorText}
            disabled={disabled}
            onValueChange={handleChange}
            className={{
                root: "w-fit",
                input: "w-fit",
                labelText: { root: "text-sm" },
                inputWrapper: inputStyles({
                    disabled,
                }),
            }}
        />
    );
};
