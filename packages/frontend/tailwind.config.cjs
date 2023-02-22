// eslint-disable-next-line @typescript-eslint/no-var-requires
const { join } = require("path");
const { long: longCommitHash } = require("git-rev-sync");

/** @type {import('tailwindcss').Config} */
module.exports = {
    important: `#carrot-template-${longCommitHash(__dirname)}`,
    content: [
        join(__dirname, "./playground/**/*.{js,jsx,ts,tsx}"),
        join(__dirname, "./src/**/*.{js,jsx,ts,tsx}"),
    ],
    presets: [require("@carrot-kpi/ui/tailwind-preset")],
    corePlugins: {
        preflight: false,
    },
};
