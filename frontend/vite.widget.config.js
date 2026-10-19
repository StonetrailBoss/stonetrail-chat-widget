import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "widget-dist",
    lib: { entry: "src/embed.jsx", name: "StonetrailWidget", formats: ["iife"], fileName: () => "stonetrail-widget.js" },
  },
});
