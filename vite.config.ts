import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default {
  base: process.env.VITE_BASE_PATH ?? "/historical-rainfall-fe/",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [vue(), tailwindcss()],
  server: {
    allowedHosts: ["chewable-spiritual-astrology.ngrok-free.dev"],
  },
};
