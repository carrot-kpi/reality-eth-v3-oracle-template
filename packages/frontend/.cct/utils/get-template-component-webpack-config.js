import { dirname, join } from "path";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
const shared = require("@carrot-kpi/host-frontend/shared-dependencies.json");

const hash = createHash("sha256");
hash.update(Date.now().toString());

const UNIQUE_ID = `carrot-template-${hash.digest("hex").slice(0, 32)}`;

export const getTemplateComponentWebpackConfig = (type, globals, outDir) => {
    if (type !== "page" && type !== "creationForm")
        throw new Error("type must either be creationForm or page");

    const devMode = !!!outDir;
    return {
        mode: devMode ? "development" : "production",
        target: "browserslist",
        devtool: false,
        infrastructureLogging: devMode
            ? {
                  level: "none",
              }
            : undefined,
        stats: devMode ? "none" : undefined,
        entry: join(__dirname, "../../src"),
        output: {
            publicPath: "auto",
            clean: true,
            ...(!!outDir ? { path: outDir } : {}),
            uniqueName: UNIQUE_ID,
        },
        resolve: {
            fallback: devMode
                ? {
                      buffer: join(__dirname, "./utils/buffer.js"),
                  }
                : undefined,
            extensions: [".ts", ".tsx", "..."],
        },
        module: {
            rules: [
                { test: /\.tsx?$/, use: "ts-loader" },
                {
                    test: /\.css$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    plugins: {
                                        tailwindcss: {},
                                        autoprefixer: {},
                                        "postcss-prefix-selector": {
                                            prefix: `#${UNIQUE_ID}`,
                                        },
                                        ...(process.env.NODE_ENV ===
                                        "production"
                                            ? { cssnano: {} }
                                            : {}),
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        optimization: {
            minimize: !!!devMode,
        },
        plugins: [
            // TODO: further globals might be passed by carrot-scripts??
            new webpack.DefinePlugin({
                ...globals,
                __ROOT_ID__: JSON.stringify(UNIQUE_ID),
                __DEV__: JSON.stringify(!!devMode),
            }),
            new MiniCssExtractPlugin(),
            new webpack.container.ModuleFederationPlugin({
                name: type,
                filename: devMode ? `${type}/remoteEntry.js` : "remoteEntry.js",
                exposes: {
                    "./component": join(
                        __dirname,
                        `./${
                            type === "page" ? "page" : "creation-form"
                        }-wrapper.tsx`
                    ),
                    "./i18n": join(
                        __dirname,
                        `../../src/${
                            type === "page" ? "page" : "creation-form"
                        }/i18n/index.ts`
                    ),
                },
                shared,
            }),
        ],
    };
};
