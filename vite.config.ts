import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import injectHTML from "vite-plugin-html-inject";
import rssPlugin from "./vite-plugin-rss";

export default defineConfig(() => {
  return {
    root: "src",
    build: {
      outDir: "../dist",
      emptyOutDir: true,
    },
    envDir: "../",
    publicDir: "../static",
    plugins: [tailwindcss(), injectHTML(), rssPlugin()],
  };
});
