import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — ハッシュルーティングのみなので相対パスで任意の静的ホスティングに配備できる
export default defineConfig({
  plugins: [react()],
  base: "./",
});
