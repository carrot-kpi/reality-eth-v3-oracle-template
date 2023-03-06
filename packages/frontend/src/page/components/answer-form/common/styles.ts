import { cva } from "class-variance-authority";

export const inputStyles = cva(["opacity-100 transition-opacity", "w-full"], {
    variants: {
        disabled: {
            true: ["opacity-20", "pointer-events-none", "cursor-no-drop"],
        },
    },
});
