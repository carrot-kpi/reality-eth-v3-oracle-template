import { KPITokenRemoteCreationFormProps } from "@carrot-kpi/react";
import { Component as CreationForm } from "../../src/creation-form";

export const Component = (props: KPITokenRemoteCreationFormProps) => {
    return (
        <div id={__ROOT_ID__} className="w-full h-full">
            <CreationForm {...props} />
        </div>
    );
};
