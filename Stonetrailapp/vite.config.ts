// This project was exported from Airo. These plugins only exist inside Airo and were
// removed, but this file still references them: sourceMapperPlugin, devToolsPlugin, fullStoryPlugin, errorInterceptorPlugin, mediaVersionsPlugin, hmrGatePlugin.
// Delete those references before running or building this project.
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import * as esbuild from "esbuild";





import { contentPlugin } from "./export-plugins/content-plugin/index.ts";

function extractHostname(value: string): string {
  try {
    if (value.includes("://")) {
      return new URL(value).hostname;
    }
    return value;
  } catch {
    return value;
  }
}
function serverBundlePlugin(): Plugin {
  return {
    name: "server-bundle",
    apply: "build",
    enforce: "post",
    closeBundle: async () => {
      // Only run during the SSR build pass.
      // vite build --ssr src/server/entry.ts --outDir dist/server outputs to dist/server/entry.js
      const entryPath = path.resolve(__dirname, "dist", "server", "entry.js");
      const {
        existsSync
      } = await import("fs");
      if (!existsSync(entryPath)) return;
      console.log("Bundling server code with esbuild...");
      await esbuild.build({
        entryPoints: [entryPath],
        bundle: true,
        platform: "node",
        target: "node22",
        format: "esm",
        outfile: path.resolve(__dirname, "dist", "server.bundle.mjs"),
        packages: "bundle",
        sourcemap: true,
        banner: {
          js: `import { createRequire } from 'module';\nconst require = createRequire(import.meta.url);`
        }
      });
      console.log("Server bundle created at dist/server.bundle.mjs");
    }
  };
}
const allowedHosts: string[] = [];
const corsOrigins: string[] = [];
if (process.env.FRONTEND_DOMAIN) {
  const frontendHost = extractHostname(process.env.FRONTEND_DOMAIN);
  allowedHosts.push(frontendHost);
  corsOrigins.push(`http://${frontendHost}`, `https://${frontendHost}`);
}
if (process.env.ALLOWED_ORIGINS) {
  const origins = process.env.ALLOWED_ORIGINS.split(",");
  allowedHosts.push(...origins.map(extractHostname));
  corsOrigins.push(...origins);
}
if (process.env.VITE_PARENT_ORIGIN) {
  allowedHosts.push(extractHostname(process.env.VITE_PARENT_ORIGIN));
  corsOrigins.push(process.env.VITE_PARENT_ORIGIN);
}
if (allowedHosts.length === 0) {
  allowedHosts.push("*");
}
if (corsOrigins.length === 0) {
  corsOrigins.push("*");
}
export default defineConfig({
  // Expose SITE_ID to import.meta.env (same as app id) for client deep links; keep VITE_ as default
  envPrefix: ["VITE_", "SITE_"],
  plugins: [contentPlugin(), react(), serverBundlePlugin()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
    alias: {
      nothing: "/src/fallbacks/missingModule.ts",
      "@/api": path.resolve(__dirname, "./src/server/api"),
      "@": path.resolve(__dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router"],
    exclude: ["drizzle-orm", "pg"]
  },
  server: {
    host: process.env.HOST || "0.0.0.0",
    port: parseInt(process.env.PORT || "5173"),
    strictPort: !!process.env.PORT,
    allowedHosts: true,
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "User-Agent"]
    },
    hmr: {
      overlay: false
    },
    watch: {
      ignored: ["**/dist/**", "**/.api/**"]
    }
  },
  preview: {
    host: process.env.HOST || "0.0.0.0",
    port: parseInt(process.env.PORT || "5173"),
    strictPort: !!process.env.PORT,
    allowedHosts,
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept", "User-Agent"]
    }
  },
  build: {
    outDir: "dist/client",
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "react-vendor";
          if (id.includes("@radix-ui/")) return "radix-ui";
          if (id.includes("@tanstack/react-query")) return "query";
        }
      }
    }
  },
  ssr: {
    external: ["drizzle-orm", "pg"]
  }
});