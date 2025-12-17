import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import injectHTML from "vite-plugin-html-inject";

export default defineConfig({
  root: "src",
  publicDir: "../static",
  plugins: [tailwindcss(), injectHTML()],
});
