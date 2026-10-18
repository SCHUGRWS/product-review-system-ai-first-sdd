import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws outside Next.js; tests run server code directly
      "server-only": fileURLToPath(
        new URL("./src/test/server-only.ts", import.meta.url),
      ),
      // The [lang] root param outside a Next.js request (see the stub)
      "next/root-params": fileURLToPath(
        new URL("./src/test/root-params.ts", import.meta.url),
      ),
      // No BotID challenge outside a Next.js request (see the stub)
      "botid/server": fileURLToPath(
        new URL("./src/test/botid-server.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
