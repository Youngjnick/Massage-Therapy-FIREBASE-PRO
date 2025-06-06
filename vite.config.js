import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite config to ensure HMR client uses the correct port for Playwright/E2E
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/Massage-Therapy-FIREBASE-PRO/" : "/",
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  plugins: [react()],
});
