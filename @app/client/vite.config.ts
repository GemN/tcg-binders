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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("react/") ||
            id.includes("react-dom") ||
            id.includes("react-router")
          ) {
            return "vendor-react";
          }

          if (
            id.includes("@apollo") ||
            id.includes("graphql") ||
            id.includes("graphql-tag")
          ) {
            return "vendor-graphql";
          }

          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("cmdk") ||
            id.includes("lucide-react") ||
            id.includes("sonner") ||
            id.includes("vaul")
          ) {
            return "vendor-ui";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }

          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("yup")
          ) {
            return "vendor-forms";
          }

          return "vendor";
        },
      },
    },
  },
  define: {
    "process.env": {},
  },
});
