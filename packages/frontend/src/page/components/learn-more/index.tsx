import { Button, Typography } from "@carrot-kpi/ui";
import type { ReactElement } from "react";
import { REALITY_WEBSITE } from "../../../commons";
import External from "../../../assets/external";

export const LearnMore = (): ReactElement => {
    return (
        <div className="flex flex-col gap-2">
            <Typography>{"Test"}</Typography>
            <Button
                href={REALITY_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                size="xsmall"
                icon={External}
                iconPlacement="right"
            >
                Reality
            </Button>
        </div>
    );
};
