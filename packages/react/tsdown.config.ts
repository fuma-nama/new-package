import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/server/collab/index.ts",
    "src/next/index.ts",
    "src/next/catch-all-page.tsx",
    "src/next/catch-all-api-route.ts",
  ],
  target: "es2023",
  fixedExtension: false,
  dts: true,
  exports: {
    enabled: true,
  },
});
