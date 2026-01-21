import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: resolve(__dirname),
  // Allow imports from parent directory (src/)
  server: {
    fs: {
      allow: [".."],
    },
  },
});
