import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: ["node_modules/", ".next/", "out/", "dist/", "build/"],
  },
  {
    extends: [
      "next/core-web-vitals",
      "next/typescript",
    ],
  },
];
