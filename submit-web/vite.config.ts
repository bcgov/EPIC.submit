import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    checker({
      // e.g. use TypeScript check
      typescript: true,
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  // maplibre-gl v5 uses ES2022 class fields internally.
  // esbuild (Vite's pre-bundler) transforms these into __publicField() helpers.
  // MapLibre's GeoJSON Web Worker runs in a separate context and cannot access
  // those helpers, causing "__publicField is not defined" crashes.
  // Fix: set target to esnext so esbuild leaves class fields as native syntax.
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
