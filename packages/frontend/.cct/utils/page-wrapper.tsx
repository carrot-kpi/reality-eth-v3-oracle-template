import { KPITokenRemotePageProps } from "@carrot-kpi/react";
import { Component as Page } from "../../src/page";

export const Component = (props: KPITokenRemotePageProps) => {
    return (
        <div id={__ROOT_ID__} className="w-full h-full">
            <Page {...props} />
        </div>
    );
};
