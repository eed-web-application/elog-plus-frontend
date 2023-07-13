/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // https://futurestud.io/tutorials/tailwind-css-remove-backticks-around-inline-code
      typography(theme) {
        return {
          DEFAULT: {
            css: {
              "code::before": {
                content: "none",
              },
              "code::after": {
                content: "none",
              },
              code: {
                color: theme("colors.gray.500"),
                backgroundColor: theme("colors.gray.100"),
                borderRadius: theme("borderRadius.DEFAULT"),
                paddingLeft: theme("spacing[1.5]"),
                paddingRight: theme("spacing[1.5]"),
                paddingTop: theme("spacing.1"),
                paddingBottom: theme("spacing.1"),
              },
            },
          },
        };
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
