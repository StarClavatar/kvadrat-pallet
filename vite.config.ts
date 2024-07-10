import process from "node:process";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import type { VitePWAOptions } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

const pwaOptions: Partial<VitePWAOptions> = {
  mode: "development",
  base: "/",
  includeAssets: ["*.png"],
  includeManifestIcons: true,
  manifest: {
    name: "Паллетная Агрегация Квадрат-С",
    short_name: "Паллетная агрегация",
    description: "Работа с паллетами сотрудниками склада с помощью ТСД",
    theme_color: "#ffffff",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
  devOptions: {
    enabled: process.env.SW_DEV === "true",
    /* when using generateSW the PWA plugin will switch to classic */
    type: "module",
    navigateFallback: "index.html",
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || "/",
  build: {
    sourcemap: process.env.SOURCE_MAP === "true",
  },
  plugins: [react(), VitePWA(pwaOptions)],
});
