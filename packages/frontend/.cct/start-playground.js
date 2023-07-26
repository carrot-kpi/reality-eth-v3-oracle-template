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
const shared = require("@carrot-kpi/host-frontend/shared-dependencies.json");

export const startPlayground = async (
    forkedNetworkChainId,
    templateId,
    secretKey,
    globals,
    writableStream,
) => {
    const playgroundFirstCompilation = true;
    const templateFirstCompilation = true;

    const templateCompiler = webpack([
        getTemplateComponentWebpackConfig("creationForm", globals),
        getTemplateComponentWebpackConfig("page", globals),
    ]);

    const templateDevServer = new WebpackDevServer(
        {
            port: "auto",
            open: false,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        },
        templateCompiler,
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
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: join(__dirname, "../playground/index.html"),
            }),
            new webpack.DefinePlugin({
                ...globals,
                CCT_TEMPLATE_URL: JSON.stringify(
                    `http://localhost:${templatePort}`,
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
        coreApplicationCompiler,
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
        templatePort,
    );

    const coreCompilerPromise = setupCompiler(
        coreApplicationCompiler,
        globals,
        writableStream,
        playgroundFirstCompilation,
        "Playground",
        playgroundPort,
    );

    // wait for the applications to be fully started
    await Promise.all([coreCompilerPromise, templateCompilerPromise]);
};
