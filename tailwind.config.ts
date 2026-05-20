import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        blue: {
          DEFAULT: "#007AFF",
          50: "#E5F1FF",
          100: "#CCE4FF",
          200: "#99C9FF",
          300: "#66ADFF",
          400: "#3392FF",
          500: "#007AFF",
          600: "#0062CC",
          700: "#004999",
          800: "#003166",
          900: "#001833",
        },
        brand: {
          bg: "#F5F5F7",
          card: "#FFFFFF",
          primary: "#1D1D1F",
          blue: "#007AFF",
          green: "#28A745",
          muted: "#86868B",
          border: "#E5E5EA",
        },
      },
      borderRadius: {
        "2xl": "18px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08)",
        modal: "0 8px 48px rgba(0,0,0,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
