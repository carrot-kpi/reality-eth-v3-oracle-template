import { Popover, Typography } from "@carrot-kpi/ui";
import { useCallback, useEffect, useState } from "react";
import { useNetwork } from "wagmi";
import { ARBITRATORS_BY_CHAIN, SupportedChain } from "../../../../commons";
import { OptionWithIcon } from "../../../../creation-form/types";
import { shortenAddress } from "../../../../utils";

const ArbitratorOption = ({ label, icon: Icon }: OptionWithIcon) => {
    return (
        <div className="flex items-center">
            <Icon className="w-7 h-7 mr-2" />
            <Typography>{label}</Typography>
        </div>
    );
};

interface ArbitratorProps {
    address: string;
}

export const Arbitrator = ({ address }: ArbitratorProps) => {
    const { chain } = useNetwork();
    const [anchor, setAnchor] = useState<HTMLDivElement | null>();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [arbitrator, setArbitrator] = useState<string | OptionWithIcon>("");

    useEffect(() => {
        if (chain && ARBITRATORS_BY_CHAIN[chain.id as SupportedChain]) {
            const lowerCaseAddress = address.toLowerCase();
            const foundArbitrator = ARBITRATORS_BY_CHAIN[
                chain.id as SupportedChain
            ].find((arbitratorOption) => {
                return (
                    (arbitratorOption.value as string).toLowerCase() ===
                    lowerCaseAddress
                );
            });
            if (foundArbitrator) {
                setArbitrator(foundArbitrator);
                return;
            }
        }
        const shortenedAddress = shortenAddress(address);
        if (shortenedAddress) setArbitrator(shortenedAddress);
    }, [address, chain]);

    const handleMouseEnter = useCallback(() => {
        setPopoverOpen(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setPopoverOpen(false);
    }, []);

    return typeof arbitrator === "string" ? (
        <>{arbitrator}</>
    ) : (
        <>
            <Typography
                ref={setAnchor}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <ArbitratorOption {...arbitrator} />
            </Typography>
            <Popover
                open={popoverOpen}
                anchor={anchor}
                className={{ root: "px-3 py-2" }}
                placement="bottom"
            >
                <Typography>{arbitrator.value}</Typography>
            </Popover>
        </>
    );
};
