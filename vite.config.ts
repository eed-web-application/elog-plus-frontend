import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { version } from "./package.json";

declare const process: { env: Record<string, string> };

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api/elog": {
        target: "http://localhost",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  base: "/elog",
  define: {
    "import.meta.env.API_ENDPOINT": JSON.stringify(process.env.API_ENDPOINT),
    "import.meta.env.APP_VERSION": JSON.stringify(version),
    "import.meta.env.COMMIT_HASH": JSON.stringify(
      execSync("git rev-parse --short HEAD").toString().trim(),
    ),
    global: {},
  },
  plugins: [react()],
});
