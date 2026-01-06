import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ['class', '[data-mode="dark"]'], // Solo activa dark mode con clase, NO con preferencia del sistema
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    plugins: [],
};
export default config;
