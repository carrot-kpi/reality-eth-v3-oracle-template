import { Popover, Typography } from "@carrot-kpi/ui";
import { useCallback, useEffect, useState } from "react";
import { useNetwork } from "wagmi";
import { ARBITRATORS_BY_CHAIN, SupportedChainId } from "../../../../commons";
import { OptionForArbitrator } from "../../../../creation-form/types";
import { shortenAddress } from "../../../../utils";

const ArbitratorOption = ({ label, icon: Icon }: OptionForArbitrator) => {
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
    const [arbitrator, setArbitrator] = useState<string | OptionForArbitrator>(
        ""
    );

    useEffect(() => {
        if (
            chain &&
            chain.id in SupportedChainId &&
            ARBITRATORS_BY_CHAIN[chain.id as SupportedChainId]
        ) {
            const lowerCaseAddress = address.toLowerCase();
            const foundArbitrator = ARBITRATORS_BY_CHAIN[
                chain.id as SupportedChainId
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
            <div
                ref={setAnchor}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <ArbitratorOption {...arbitrator} />
            </div>
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
