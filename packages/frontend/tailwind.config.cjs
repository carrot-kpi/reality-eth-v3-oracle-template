// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        join(__dirname, "./playground/**/*.{js,jsx,ts,tsx}"),
        join(__dirname, "./src/**/*.{js,jsx,ts,tsx}"),
    ],
    presets: [require("@carrot-kpi/ui/tailwind-preset")],
    corePlugins: {
        preflight: false,
    },
};
