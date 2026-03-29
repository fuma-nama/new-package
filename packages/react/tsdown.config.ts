import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/server/collab/index.ts",
    "src/next/index.ts",
    "src/next/catch-all-page.tsx",
    "src/next/catch-all-api-route.ts",
    "src/providers/*",
  ],
  target: "es2023",
  fixedExtension: false,
  dts: true,
  exports: {
    enabled: true,
  },
  unbundle: true,
});
