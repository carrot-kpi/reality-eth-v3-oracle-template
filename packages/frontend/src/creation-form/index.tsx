import { ChangeEvent, ReactElement, useCallback, useState } from "react";
import { ethers } from "ethers";
import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { TextInput, Button } from "@carrot-kpi/ui";

import "../global.css";

interface CreationFormProps {
    t: NamespacedTranslateFunction;
    onDone: (data: string, value: ethers.BigNumber) => void;
}

export const Component = ({ t, onDone }: CreationFormProps): ReactElement => {
    const [test, setTest] = useState("");

    const handleTestChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setTest(event.target.value);
        },
        []
    );

    const handleSubmit = useCallback(() => {
        onDone(
            ethers.utils.defaultAbiCoder.encode(["string"], [test]),
            ethers.utils.parseEther("0.01") // random value
        );
    }, [onDone, test]);

    return (
        <div className="flex flex-col gap-2 w-fit">
            <TextInput
                id="test"
                label={t("label.test")}
                placeholder="Test"
                onChange={handleTestChange}
                value={test}
            />
            <br />
            <Button onClick={handleSubmit}>{t("submit")}</Button>
        </div>
    );
};
