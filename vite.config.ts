import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { version } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (mode === "development" && !env.DEV_API_ENDPOINT) {
    throw new Error(
      "DEV_API_ENDPOINT is required in development mode. Please copy .env.example to .env and fill in the required values.",
    );
  }

  return {
    server: {
      proxy: {
        "/api/elog": {
          target: env.DEV_API_ENDPOINT,
          rewrite: (path) => path.replace(/^\/api\/elog/, ""),
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    base: "/elog",
    define: {
      "import.meta.env.API_ENDPOINT": JSON.stringify(env.API_ENDPOINT),
      "import.meta.env.APP_VERSION": JSON.stringify(version),
      "import.meta.env.COMMIT_HASH": JSON.stringify(
        execSync("git rev-parse --short HEAD").toString().trim(),
      ),
      global: {},
    },
    plugins: [react()],
  };
});
