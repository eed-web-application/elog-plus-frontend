import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { version } from "./package.json";

// https://www.quirksmode.org/js/cookies.html
function readCookie(cookieStr: string, name: string) {
  var nameEQ = name + "=";
  var ca = cookieStr.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

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
          // Since the backend is using token-based authentication during development,
          // we need to get the development cookie and pass it as a header to the backend.
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const cookie = req.headers.cookie;

              const devSlacVouch = readCookie(cookie, "dev-slac-vouch");

              if (devSlacVouch) {
                proxyReq.setHeader("x-vouch-idp-accesstoken", devSlacVouch);
              }
            });
          },
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
