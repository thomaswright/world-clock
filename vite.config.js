import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "https://thomaswright.github.io/world-clock",
  plugins: [
    react({
      include: ["**/*.res.mjs"],
    }),
  ],
});
