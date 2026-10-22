// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F6',
        ink: '#1C1C1C',
        white: '#FFFFFF',
        muted: '#6F6D68',
        hover: '#F4F2ED',
        laser: '#FF2A2A',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;