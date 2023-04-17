import chalk from "chalk";

import { formatWebpackMessages } from "./utils/format-webpack-messages.js";
import { printInstructions } from "./utils/print-instructions.js";

export const setupCompiler = (
    compiler,
    globals,
    writableStream,
    firstCompilation,
    type,
    frontendPort
) => {
    return new Promise((resolve) => {
        compiler.hooks.invalid.tap("invalid", () => {
            if (!firstCompilation) {
                printInstructions(
                    writableStream,
                    globals,
                    `Compiling playground -> ${type}...`
                );
            }
        });

        compiler.hooks.done.tap("done", async (stats) => {
            if (firstCompilation) {
                resolve();
                firstCompilation = false;
            }

            const statsData = stats.toJson({
                all: false,
                warnings: true,
                errors: true,
            });

            const messages = formatWebpackMessages(statsData);

            if (messages.errors.length > 0) {
                printInstructions(
                    writableStream,
                    globals,
                    `Failed to compile playground -> ${type}.\n${messages.errors.join(
                        "\n\n"
                    )}`
                );

                return;
            }

            if (messages.warnings.length > 0) {
                printInstructions(
                    writableStream,
                    globals,
                    chalk.yellow(
                        `Playground compiled with warnings -> ${type}:\n${messages.warnings.join(
                            "\n\n"
                        )}`
                    )
                );

                return;
            }

            printInstructions(writableStream, globals, null, frontendPort);
        });
    });
};
