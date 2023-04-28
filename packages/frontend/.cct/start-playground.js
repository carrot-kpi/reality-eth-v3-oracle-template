import WebpackDevServer from "webpack-dev-server";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { join, dirname } from "path";
import webpack from "webpack";
import { fileURLToPath } from "url";

import postcssOptions from "../postcss.config.js";
import { setupCompiler } from "./setup-compiler.js";
import { createRequire } from "module";
import { getTemplateComponentWebpackConfig } from "./utils/get-template-component-webpack-config.js";

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
    const playgroundFirstCompilation = true;
    const templateFirstCompilation = true;

    const templateCompiler = webpack([
        getTemplateComponentWebpackConfig(
            "creationForm",
            join(__dirname, "../src/creation-form/index.tsx"),
            join(__dirname, "../src/creation-form/i18n/index.ts"),
            globals
        ),
        getTemplateComponentWebpackConfig(
            "page",
            join(__dirname, "../src/page/index.tsx"),
            join(__dirname, "../src/page/i18n/index.ts"),
            globals
        ),
    ]);

    const templateDevServer = new WebpackDevServer(
        { port: "auto", open: false },
        templateCompiler
    );

    await templateDevServer.start();
    const { port: templatePort } = templateDevServer.server.address();

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
            new webpack.DefinePlugin({
                ...globals,
                CCT_TEMPLATE_URL: JSON.stringify(
                    `http://localhost:${templatePort}`
                ),
            }),
            new webpack.container.ModuleFederationPlugin({
                name: "host",
                shared,
            }),
        ],
    });

    // initialize the webpack dev servers
    const playgroundDevServer = new WebpackDevServer(
        {
            port: "auto",
            open: true,
            compress: true,
        },
        coreApplicationCompiler
    );

    await playgroundDevServer.start();
    const { port: playgroundPort } = playgroundDevServer.server.address();

    // setup the applications compilers hooks
    const templateCompilerPromise = setupCompiler(
        templateCompiler,
        globals,
        writableStream,
        templateFirstCompilation,
        "Template",
        templatePort
    );

    const coreCompilerPromise = setupCompiler(
        coreApplicationCompiler,
        globals,
        writableStream,
        playgroundFirstCompilation,
        "Playground",
        playgroundPort
    );

    // wait for the applications to be fully started
    await Promise.all([coreCompilerPromise, templateCompilerPromise]);
};
