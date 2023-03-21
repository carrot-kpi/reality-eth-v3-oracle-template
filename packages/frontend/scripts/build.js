#!/usr/bin/env node

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { rm, writeFile } from "fs/promises";
import { long as longCommitHash } from "git-rev-sync";
import chalk from "chalk";
import ora from "ora";
import { createRequire } from "module";
import { existsSync } from "fs";
import webpack from "webpack";
import { getTemplateComponentWebpackConfig } from "../.cct/utils/get-template-component-webpack-config.js";
import { formatWebpackMessages } from "../.cct/utils/format-webpack-messages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);

// TODO: support different React versions
const main = async () => {
    const outDir = join(__dirname, "../dist");

    let spinner = ora();
    const commitHash = longCommitHash(join(__dirname, "../"));

    spinner = ora(`Removing previous ${chalk.blue("dist")} folder`);
    const dist = join(__dirname, "../dist");
    if (existsSync(dist)) await rm(dist, { recursive: true });
    spinner.succeed(`Previous ${chalk.blue("dist")} folder removed`);

    spinner = ora();
    spinner.start(`Building ${chalk.blue("federated modules")}`);
    await new Promise((resolve) => {
        webpack(
            [
                getTemplateComponentWebpackConfig(
                    "creationForm",
                    join(__dirname, "../src/creation-form/index.tsx"),
                    join(__dirname, "../src/creation-form/i18n/index.ts"),
                    {},
                    join(dist, "creationForm")
                ),
                getTemplateComponentWebpackConfig(
                    "page",
                    join(__dirname, "../src/page/index.tsx"),
                    join(__dirname, "../src/page/i18n/index.ts"),
                    {},
                    join(dist, "page")
                ),
            ],
            (error, stats) => {
                if (error) {
                    spinner.fail(
                        `Failed to build ${chalk.blue("federated modules")}`
                    );
                    console.log();
                    console.log(error.message || error);
                    console.log();
                    process.exit(0);
                }

                const statsData = stats.toJson({
                    all: false,
                    warnings: true,
                    errors: true,
                });

                const messages = formatWebpackMessages(statsData);

                if (messages.errors.length) {
                    if (messages.errors.length > 1) messages.errors.length = 1;
                    spinner.fail(
                        `Failed to build ${chalk.blue("federated modules")}`
                    );
                    console.log();
                    console.log(messages.errors.join("\n\n"));
                    process.exit(0);
                }

                if (messages.warnings.length) {
                    spinner.warn(
                        `${chalk.blue("Federated modules")} built with warnings`
                    );
                    console.log();
                    console.log(messages.warnings.join("\n\n"));
                    console.log();
                    resolve();
                    return;
                }

                spinner.succeed(`${chalk.blue("Federated modules")} built`);
                resolve();
            }
        );
    });
    spinner.succeed(`${chalk.blue("Federated modules")} successfully built`);

    spinner = ora(`Building ${chalk.blue("base.json")}`);
    const partialBase = require("../src/base.json");
    await writeFile(
        join(outDir, "base.json"),
        JSON.stringify({
            ...partialBase,
            commitHash,
        })
    );
    spinner.succeed(`${chalk.blue("base.json")} built`);
};

main().then().catch(console.error);
