import { Oracle } from "@carrot-kpi/sdk";
import { ReactElement } from "react";
import { NamespacedTranslateFunction } from "@carrot-kpi/react";

interface PageProps {
    t: NamespacedTranslateFunction;
    oracle: Oracle;
}

export const Component = ({ t, oracle }: PageProps): ReactElement => {
    return (
        <>
            {t("main")}
            <br />
            Address: {oracle.address}
        </>
    );
};
