import { Oracle } from "@carrot-kpi/sdk";
import { ReactElement } from "react";
import { TFunction } from "react-i18next";

interface PageProps {
    t: TFunction;
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
