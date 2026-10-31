import { defineConfig } from "void/config";

export default defineConfig({
  sourceDir: "src",
  target: "cloudflare",
  // Match the sibling's date supported by the locked local Workers runtime.
  worker: { compatibility_date: "2026-10-25", compatibility_flags: ["nodejs_compat"] },
  cloudflare: {
    name: "hotdogornot",
    account_id: "ac6ec0b998d8eb9a92746d8dd276bdf0",
    workers_dev: true,
    preview_urls: true,
    routes: [],
    observability: { enabled: true, traces: { enabled: true } },
  },
  head: {
    title: "Hotdog or Not — one photo, one answer",
    htmlAttrs: { lang: "en" },
    link: [{ rel: "icon", href: "/logo.svg" }],
    meta: [
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "Name an object. Take a photo. Get a yes or a no." },
      { name: "theme-color", content: "#111310" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hotdogornot.nujhong.workers.dev/" },
      { property: "og:title", content: "Hotdog or Not — one photo, one answer" },
      { property: "og:description", content: "Name an object. Take a photo. Get a yes or a no." },
      // Crawlers need an absolute raster URL; SVG previews are not widely supported.
      { property: "og:image", content: "https://hotdogornot.nujhong.workers.dev/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "The hotdog or not. logo and wordmark" },
      { name: "twitter:card", content: "summary_large_image" },
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
