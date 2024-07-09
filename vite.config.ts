import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

// https://vite-pwa-org.netlify.app/guide/

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      outDir: "dist",
      includeAssets: ["public/android-chrome-192x192.png", "public/android-chrome-512x512.png", "public/apple-touch-icon.png"],
      manifest: {
        name: "Паллетная Агрегация Квадрат-С",
        short_name: "Паллетная агрегация",
        description: "Работа с паллетами сотрудниками склада с помощью ТСД",
        theme_color: "#ffffff",
        icons: [
          {
            src: "public/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "public/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
