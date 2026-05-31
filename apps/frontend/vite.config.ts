import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  resolve: {
    alias: {
      "@exam-countdown/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts")
    }
  },
  build: {
    outDir: "../../dist/frontend",
    emptyOutDir: true
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
