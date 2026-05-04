import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_BASE || "http://127.0.0.1:8787";

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  };
});
