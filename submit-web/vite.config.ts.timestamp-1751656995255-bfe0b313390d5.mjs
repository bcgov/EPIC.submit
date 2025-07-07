// vite.config.ts
import { defineConfig } from "file:///C:/Users/jadms/OneDrive/Desktop/epic-submit/EPIC.submit/submit-web/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/jadms/OneDrive/Desktop/epic-submit/EPIC.submit/submit-web/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { TanStackRouterVite } from "file:///C:/Users/jadms/OneDrive/Desktop/epic-submit/EPIC.submit/submit-web/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import istanbul from "file:///C:/Users/jadms/OneDrive/Desktop/epic-submit/EPIC.submit/submit-web/node_modules/vite-plugin-istanbul/dist/index.mjs";
import checker from "file:///C:/Users/jadms/OneDrive/Desktop/epic-submit/EPIC.submit/submit-web/node_modules/vite-plugin-checker/dist/esm/main.js";
var vite_config_default = defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    istanbul({
      cypress: true,
      requireEnv: false
    }),
    checker({
      // e.g. use TypeScript check
      typescript: true
    })
  ],
  resolve: {
    alias: {
      "@": "/src"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqYWRtc1xcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGVwaWMtc3VibWl0XFxcXEVQSUMuc3VibWl0XFxcXHN1Ym1pdC13ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGphZG1zXFxcXE9uZURyaXZlXFxcXERlc2t0b3BcXFxcZXBpYy1zdWJtaXRcXFxcRVBJQy5zdWJtaXRcXFxcc3VibWl0LXdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvamFkbXMvT25lRHJpdmUvRGVza3RvcC9lcGljLXN1Ym1pdC9FUElDLnN1Ym1pdC9zdWJtaXQtd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSBcIkB0YW5zdGFjay9yb3V0ZXItcGx1Z2luL3ZpdGVcIjtcclxuaW1wb3J0IGlzdGFuYnVsIGZyb20gXCJ2aXRlLXBsdWdpbi1pc3RhbmJ1bFwiO1xyXG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgVGFuU3RhY2tSb3V0ZXJWaXRlKCksXHJcbiAgICByZWFjdCgpLFxyXG4gICAgaXN0YW5idWwoe1xyXG4gICAgICBjeXByZXNzOiB0cnVlLFxyXG4gICAgICByZXF1aXJlRW52OiBmYWxzZSxcclxuICAgIH0pLFxyXG4gICAgY2hlY2tlcih7XHJcbiAgICAgIC8vIGUuZy4gdXNlIFR5cGVTY3JpcHQgY2hlY2tcclxuICAgICAgdHlwZXNjcmlwdDogdHJ1ZSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IFwiL3NyY1wiLFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3WSxTQUFTLG9CQUFvQjtBQUNyYSxPQUFPLFdBQVc7QUFDbEIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sYUFBYTtBQUlwQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxtQkFBbUI7QUFBQSxJQUNuQixNQUFNO0FBQUEsSUFDTixTQUFTO0FBQUEsTUFDUCxTQUFTO0FBQUEsTUFDVCxZQUFZO0FBQUEsSUFDZCxDQUFDO0FBQUEsSUFDRCxRQUFRO0FBQUE7QUFBQSxNQUVOLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
