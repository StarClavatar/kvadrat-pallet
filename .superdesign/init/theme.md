# Theme and styling

## Compact actual token summary

- Theme system: no Tailwind, CSS variables, theme provider, token file, or dark mode. Styling is plain global CSS plus per-page global CSS and CSS Modules.
- Global font: `"Rubik", sans-serif`; Series Photos overrides with `system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif`.
- Series Photos palette: page `#f3f4f6`; surface `#ffffff`; header `#1e3a8a`; primary/focus `#2563eb`; primary text `#111827`; secondary text `#6b7280`; border `#e5e7eb`; success/action `#1dd86e`; error `#dc2626`; error surface `#fef2f2`.
- Other shared semantic colors: confirm `#4CAF50`; destructive `#f44336`; scanner success `#4caf50`; scanner warning `#FFD700`; overlay `rgba(0,0,0,0.5–0.8)`.
- Type scale actually used: 12, 13, 14, 15, 16, 17, 18, 20, 24, 30, 32px; weights 500, 600, 700, 800.
- Spacing values commonly used: 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 32px. No named spacing scale.
- Radius values: 4, 5, 6, 8, 10, 11, 12, 14, 16, 20, 30px and `50%`/`999px`.
- Shadows: `0 2px 8px rgba(0,0,0,.15)`, `0 4px 12px rgba(0,0,0,.05)`, `0 4px 12px rgba(0,0,0,.39)`, plus blue-tinted card shadows.
- Breakpoints found: `max-width: 768px`, `max-height: 475px`, and landscape orientation. Series Photos has no media query and is built mobile-first around `100svh`.
- Root sizing: `html`, `body`, and `#root` fill the viewport; body is fixed with vertical scrolling and iOS momentum scrolling.

## Raw theme/config sources

There is no Tailwind config or standalone theme/design-token source. `src/App.css` exists but is empty. The complete global theme-bearing source is:

### `src/index.css`
```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
}

html {
  overflow: hidden;
}
body {
  height: 100%;
  position: fixed;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
}

* {
  font-family: "Rubik", sans-serif;  /* margin: 0;
  padding: 0; */
}
```

### `vite.config.ts`
This is not a visual theme config, but it is the complete framework/PWA config that supplies the manifest theme color.

```ts
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
```

Target-specific source note: the complete Series Photos visual implementation is `src/pages/SeriesPhotos/SeriesPhotos.module.css`; it is page CSS rather than a shared theme configuration and should be included as a target context file together with the three Series Photos TSX files.
