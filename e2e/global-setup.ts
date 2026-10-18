import { type FullConfig, request } from "@playwright/test";
import { sharedBatches } from "./fixtures/products";
import { seedProducts } from "./helpers";

// Imports the shared fixture products once, after the web server is up and
// before any spec runs. Specs only read them (or review them with their own
// fresh accounts); products a test changes are its own (importOwnProduct).
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  const api = await request.newContext({ baseURL });
  try {
    await seedProducts(api, sharedBatches);
  } finally {
    await api.dispose();
  }
}
