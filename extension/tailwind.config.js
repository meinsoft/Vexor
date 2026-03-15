/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.html", "./*.js"],
    theme: {
        extend: {
            colors: {
                vexor: {
                    950: "#1a0533",
                    900: "#2d1b69",
                    800: "#3b2080",
                    700: "#5b32a8",
                    600: "#6c3fa0",
                    500: "#8b5cf6",
                    400: "#a78bfa",
                    300: "#c084fc",
                    200: "#ddd6fe",
                    100: "#ede9fe",
                    50: "#f5f3ff",
                },
                risk: {
                    critical: "#E24B4A",
                    high: "#EF9F27",
                    medium: "#F0C040",
                    low: "#1D9E75",
                },
                glass: {
                    bg: "rgba(255, 255, 255, 0.06)",
                    border: "rgba(255, 255, 255, 0.10)",
                    "bg-hover": "rgba(255, 255, 255, 0.10)",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [],
};
