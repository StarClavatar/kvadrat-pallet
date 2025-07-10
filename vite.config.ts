import process from "node:process";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import type { VitePWAOptions } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const pwaOptions: Partial<VitePWAOptions> = {
    mode: "development",
    base: "/",
    includeAssets: ["*.png", "*.mp3"],
    includeManifestIcons: true,
    manifest: {
      name: env.VITE_APP_NAME,
      short_name: env.VITE_APP_SHORT_NAME,
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
    registerType: "prompt",
    workbox: {
      clientsClaim: true,
      skipWaiting: false,
    },
    injectRegister: "auto",
    devOptions: {
      enabled: env.SW_DEV === "true",
      type: "module",
      navigateFallback: "index.html",
    },
  };

  return {
    base: "/",
    build: {
      sourcemap: env.SOURCE_MAP === "true",
    },
    plugins: [react(), VitePWA(pwaOptions)],
  };
});