import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [vue(), tailwindcss()],
  server: {
    allowedHosts: ["chewable-spiritual-astrology.ngrok-free.dev"],
  },
};
