import type { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { Button, Typography } from "@carrot-kpi/ui";
import type { ReactElement } from "react";
import { REALITY_WEBSITE } from "../../../commons";
import External from "../../../assets/external";

interface LearnMoreProps {
    t: NamespacedTranslateFunction;
}

export const LearnMore = ({ t }: LearnMoreProps): ReactElement => {
    return (
        <div className="flex flex-col gap-2">
            <Typography>{t("label.answer.learnMore")}</Typography>
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
