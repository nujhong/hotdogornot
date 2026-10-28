import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";
import { voidReact } from "@void/react/plugin";

const generated = [".void/**", ".wrangler/**", "dist/**"];
const parentImports = { group: ["../**"], message: "Use ~/ for imports across directories." };
const browserRules = {
  paths: ["void", "cloudflare:workers", ...builtinModules],
  patterns: [
    parentImports,
    {
      group: ["node:*", "~/**", "!~/client/**", "!~/shared/**"],
      message: "Keep server code out of the browser.",
    },
    { group: ["void/*", "!void/client"], message: "Use void/client in browser code." },
  ],
};

export default defineConfig(({ mode }) => ({
  resolve: { alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/integration/**/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
  lint: {
    ignorePatterns: generated,
    options: { typeAware: true, typeCheck: true },
    rules: { "unicorn/filename-case": ["error", { case: "kebabCase" }] },
    overrides: [
      {
        files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
        rules: { "no-restricted-imports": ["error", { patterns: [parentImports] }] },
      },
      {
        files: ["src/client/**/*.{ts,tsx}", "src/pages/**/*.{ts,tsx}"],
        rules: { "no-restricted-imports": ["error", browserRules] },
      },
      {
        files: ["src/shared/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: ["void", "cloudflare:workers", ...builtinModules],
              patterns: [
                parentImports,
                {
                  group: ["node:*", "void/*", "~/**", "!~/shared/**"],
                  message: "Shared code must remain browser-safe and independent.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["src/server/**/*.ts", "src/routes/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                parentImports,
                {
                  group: ["~/**", "!~/server/**", "!~/shared/**"],
                  message:
                    "Server evaluation and routes can only depend on server and shared code.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["src/middleware/**/*.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              patterns: [
                parentImports,
                {
                  group: ["~/**", "!~/shared/**"],
                  message: "Middleware can only depend on shared application code.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
  fmt: { ignorePatterns: [...generated, "pnpm-lock.yaml"] },
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
  plugins: mode === "test" ? [] : [voidPlugin(), voidReact({ react: { compiler: true } })],
}));
