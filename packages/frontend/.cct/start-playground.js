import WebpackDevServer from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { join, dirname } from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";
import { long as longCommitHash } from "git-rev-sync";

import postcssOptions from "../postcss.config.js";
import { setupCompiler } from "./setup-compiler.js";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const shared = require("@carrot-kpi/frontend/shared-dependencies.json");

export const startPlayground = async (
    forkedNetworkChainId,
    templateId,
    secretKey,
    globals,
    writableStream
) => {
    const coreFirstCompilation = true;
    const templateFirstCompilation = true;

    // initialize the applications compiler
    const coreApplicationCompiler = webpack({
        mode: "development",
        infrastructureLogging: {
            level: "none",
        },
        stats: "none",
        entry: join(__dirname, "../playground/index.tsx"),
        resolve: {
            fallback: {
                buffer: join(__dirname, "./utils/buffer.js"),
            },
            extensions: [".ts", ".tsx", "..."],
        },
        module: {
            rules: [
                { test: /\.tsx?$/, use: "ts-loader" },
                {
                    test: /\.css$/i,
                    use: [
                        "style-loader",
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions,
                            },
                        },
                    ],
                },
                {
                    test: /\.svg/,
                    use: [
                        {
                            loader: "@svgr/webpack",
                            options: {
                                prettier: false,
                                svgoConfig: {
                                    plugins: [
                                        {
                                            name: "preset-default",
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        "url-loader",
                    ],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: join(__dirname, "../playground/index.html"),
            }),
            new webpack.DefinePlugin(globals),
            new webpack.container.ModuleFederationPlugin({
                name: "host",
                shared,
            }),
        ],
    });

    const commitHash = longCommitHash(join(__dirname, "../"));
    const templateApplicationCompiler = webpack({
        mode: "development",
        infrastructureLogging: {
            level: "none",
        },
        stats: "none",
        entry: join(__dirname, "../src"),
        resolve: {
            fallback: {
                buffer: join(__dirname, "./utils/buffer.js"),
            },
            extensions: [".ts", ".tsx", "..."],
        },
        module: {
            rules: [
                { test: /\.tsx?$/, use: "ts-loader" },
                {
                    test: /\.css$/i,
                    use: [
                        "style-loader",
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions,
                            },
                        },
                    ],
                },
                {
                    test: /\.svg/,
                    use: [
                        {
                            loader: "@svgr/webpack",
                            options: {
                                prettier: false,
                                svgoConfig: {
                                    plugins: [
                                        {
                                            name: "preset-default",
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        "url-loader",
                    ],
                },
            ],
        },
        plugins: [
            new webpack.DefinePlugin(globals),
            new webpack.container.ModuleFederationPlugin({
                name: `${commitHash}creationForm`,
                library: { type: "window", name: `${commitHash}creationForm` },
                exposes: {
                    "./component": join(
                        __dirname,
                        "../src/creation-form/index.tsx"
                    ),
                    "./i18n": join(
                        __dirname,
                        "../src/creation-form/i18n/index.ts"
                    ),
                },
                shared,
            }),
            new webpack.container.ModuleFederationPlugin({
                name: `${commitHash}page`,
                library: { type: "window", name: `${commitHash}page` },
                exposes: {
                    "./component": join(__dirname, "../src/page/index.tsx"),
                    "./i18n": join(__dirname, "../src/page/i18n/index.ts"),
                },
                shared,
            }),
        ],
    });

    // setup the applications compilers hooks
    const coreCompilerPromise = setupCompiler(
        coreApplicationCompiler,
        globals,
        writableStream,
        coreFirstCompilation,
        "CORE"
    );
    const templateCompilerPromise = setupCompiler(
        templateApplicationCompiler,
        globals,
        writableStream,
        templateFirstCompilation,
        "TEMPLATE"
    );

    // initialize the webpack dev servers
    const coreApplicationDevServer = new WebpackDevServer(
        {
            port: 9000,
            open: true,
            compress: true,
        },
        coreApplicationCompiler
    );
    const templateApplicationDevServer = new WebpackDevServer(
        {
            port: 9002,
            open: false,
            compress: true,
            headers: {
                "Access-Control-Allow-Origin": "http://localhost:9000",
            },
        },
        templateApplicationCompiler
    );

    // run the applications
    await coreApplicationDevServer.start();
    await templateApplicationDevServer.start();

    // wait for the applications to be fully started
    await Promise.all([coreCompilerPromise, templateCompilerPromise]);
};
