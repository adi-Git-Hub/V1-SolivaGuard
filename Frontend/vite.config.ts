// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  // This deployment self-hosts the SSR bundle via Node `vite preview` (systemd, port 8080),
  // NOT Cloudflare Workers. The Cloudflare build plugin emits a Workers bundle named
  // `dist/server/index.js`, but TanStack Start's preview server loads `dist/server/server.js`
  // (derived from `server.entry` below) — causing ERR_MODULE_NOT_FOUND in production.
  // Disabling it makes the build emit the standard Node SSR entry that `vite preview` serves.
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["solivaguard.com", "www.solivaguard.com"],
    },
  },
});
