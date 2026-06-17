import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@app/config": path.resolve(__dirname, "../config"),
      "@app/graphql": path.resolve(__dirname, "../graphql"),
      "@": path.resolve(__dirname, "./src"),
      "void-elements": path.resolve(__dirname, "./src/lib/void-elements.ts"),
    },
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    force: true,
    include: ["@app/config"],
    exclude: ["@app/graphql"],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /@app\/config/],
    },
  },
  define: {
    "process.env": {},
  },
});
