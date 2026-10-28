import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: "src",
  target: "cloudflare",
  // Match the sibling's date supported by the locked local Workers runtime.
  worker: { compatibility_date: "2026-10-25", compatibility_flags: ["nodejs_compat"] },
  cloudflare: {
    name: "hotdog-or-not",
    observability: { enabled: true, traces: { enabled: true } },
  },
  head: {
    title: "Hotdog or Not — one photo, one answer",
    htmlAttrs: { lang: "en" },
    meta: [
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "Name an object. Take a photo. Get a yes or a no." },
      { name: "theme-color", content: "#111310" },
    ],
  },
  routing: {
    headers: {
      "/*": [
        "X-Content-Type-Options: nosniff",
        "Referrer-Policy: strict-origin-when-cross-origin",
        "X-Frame-Options: DENY",
        "Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()",
      ],
      "/api/recognitions": ["Cache-Control: no-store"],
    },
  },
});
