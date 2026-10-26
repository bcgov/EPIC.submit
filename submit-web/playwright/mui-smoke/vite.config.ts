import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const webRoot = fileURLToPath(new URL("../../", import.meta.url));
export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [react()],
  resolve: { alias: { "@": `${webRoot}src` } },
  build: { outDir: `${webRoot}node_modules/.cache/mui-smoke`, emptyOutDir: true },
});
