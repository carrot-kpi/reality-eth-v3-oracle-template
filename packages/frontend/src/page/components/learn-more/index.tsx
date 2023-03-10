import { NamespacedTranslateFunction } from "@carrot-kpi/react";
import { Button, Typography } from "@carrot-kpi/ui";
import { ReactElement } from "react";
import { REALITY_WEBSITE } from "../../../commons";
import { ReactComponent as ExternalSvg } from "../../../assets/external.svg";

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
                icon={ExternalSvg}
                iconPlacement="right"
            >
                Reality
            </Button>
        </div>
    );
};
