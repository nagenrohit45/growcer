import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import handler from "./server/app.js";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
  return {
    plugins: [
      react(),
      {
        name: "growcer-local-api",
        configureServer(server) {
          server.middlewares.use("/api", (req, res) => {
            req.url = "/api" + req.url;
            handler(req, res);
          });
        },
      },
    ],
  };
});
