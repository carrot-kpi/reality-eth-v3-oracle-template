import type { SVGProps } from "react";

export type SVGIconProps = Omit<
    SVGProps<SVGSVGElement>,
    "dangerouslySetInnerHTML"
>;
