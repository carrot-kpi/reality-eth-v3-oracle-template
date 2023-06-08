import type { SVGIconProps } from "./types";

const Danger = (props: SVGIconProps) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path d="M12 10V13" stroke="currentColor" strokeLinecap="round" />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11.1381 4.46529C11.5247 3.80798 12.4753 3.80798 12.8619 4.46529L21.1135 18.493C21.5057 19.1596 21.025 20 20.2516 20H3.74842C2.975 20 2.49435 19.1596 2.88648 18.493L11.1381 4.46529Z"
                stroke="currentColor"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Danger;
