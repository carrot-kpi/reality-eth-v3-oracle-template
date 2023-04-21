import { Skeleton, Typography } from "@carrot-kpi/ui";
import { OptionForArbitrator } from "../../types";
import { useNetwork } from "wagmi";

export const ArbitratorOption = ({
    label,
    icon: Icon,
    disputeFee,
}: OptionForArbitrator) => {
    const { chain } = useNetwork();

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Icon className="w-7 h-7 mr-3" />
                <Typography>{label}</Typography>
            </div>
            {!disputeFee ? (
                <Skeleton width="50px" />
            ) : (
                <Typography>{`${disputeFee} (${chain?.nativeCurrency.symbol})`}</Typography>
            )}
        </div>
    );
};
