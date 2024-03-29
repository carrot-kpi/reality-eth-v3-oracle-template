import type { ReactElement } from "react";

export const VerticalDivider = (): ReactElement => {
    return (
        <div className="hidden md:flex h-24 w-[1px] bg-black dark:bg-white" />
    );
};
