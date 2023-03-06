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
    onChange: (value: BigNumber) => void;
}

export const BondInput = ({ t, disabled, value, onChange }: BondInputProps) => {
    const nativeCurrency = useNativeCurrency();

    const handleChange = useCallback(
        (value: NumberFormatValue) => {
            onChange(utils.parseUnits(value.value, nativeCurrency.decimals));
        },
        [nativeCurrency, onChange]
    );

    return (
        <NumberInput
            id="bond"
            label={t("label.question.form.bond")}
            placeholder={"0.0"}
            allowNegative={false}
            min={0}
            value={
                value ? utils.formatUnits(value, nativeCurrency.decimals) : null
            }
            disabled={disabled}
            onValueChange={handleChange}
            className={{
                root: "w-full",
                input: "w-full",
                inputWrapper: inputStyles({
                    disabled,
                }),
            }}
        />
    );
};
