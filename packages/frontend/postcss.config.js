import tailwindPostCssConfig from "./tailwind.config.cjs";

export default {
    plugins: {
        tailwindcss: { config: tailwindPostCssConfig },
        autoprefixer: {},
        ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
    },
};
