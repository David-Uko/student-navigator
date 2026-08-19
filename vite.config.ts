import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// Plain Vite config for a TanStack Start (React) app.
// Plugin order matters: Tailwind and the tsconfig path resolver first,
// then the TanStack Start plugin, then the Nitro server-build plugin,
// then the React plugin last.
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error-handling wrapper).
      server: { entry: "server" },
    }),
    // No preset specified: Nitro auto-detects the target platform at build
    // time (e.g. it detects Vercel's build environment automatically and
    // produces Vercel Functions output, per Vercel's own TanStack Start
    // deployment guide). Locking this to a single preset like "node-server"
    // would override that detection and break a Vercel deployment.
    nitro(),
    viteReact(),
  ],
});
