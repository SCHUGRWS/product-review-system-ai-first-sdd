// Builds n8n/workflows/amazon-deals-import.json with n8n/browserless/extract-deals.js
// inlined, so the workflow and the tested extraction never drift.
//   pnpm n8n:build            write the workflow JSON
//   pnpm n8n:build --check    fail when the committed JSON is out of date
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const extractCode = readFileSync(
  join(root, "browserless/extract-deals.js"),
  "utf8",
);
const output = join(root, "workflows/amazon-deals-import.json");

const WORKFLOW_ID = "AmzDealsImport01";
const PAUSE_SECONDS = 8;
const BATCH_SIZE = 100;

// Deal categories: Amazon filter "bubbles" (deals-collection-<slug>). "coupons" is
// skipped (coupons, not products). The general page goes first so the category
// pages, read later, set each product's category.
const CATEGORIES = [
  ["automotive", "Automotive"],
  ["baby", "Baby"],
  ["beauty", "Beauty"],
  ["books", "Books"],
  ["computers", "Computers"],
  ["eBooks", "eBooks"],
  ["electronics", "Electronics"],
  ["eletro", "Appliances"],
  ["fashion", "Fashion"],
  ["grocery", "Grocery"],
  ["health-and-personal-care", "Health and personal care"],
  ["home", "Home"],
  ["kitchen", "Kitchen"],
  ["lawn-and-garden", "Garden"],
  ["moveis", "Furniture"],
  ["office-products", "Office"],
  ["pet-products", "Pet products"],
  ["sports", "Sports"],
  ["tools", "Tools"],
  ["toys-and-games", "Toys and games"],
  ["tvs", "TVs"],
  ["video-games", "Video games"],
];

// Stable node ids, so rebuilding does not change the JSON
const nodeId = (name) => {
  const h = createHash("sha256").update(`${WORKFLOW_ID}:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const node = (name, type, typeVersion, position, parameters, extra = {}) => ({
  parameters,
  id: nodeId(name),
  name,
  type,
  typeVersion,
  position,
  ...extra,
});

const categoriesCode = `// Pages to read, one at a time. Edit CATEGORIES in n8n/build-workflow.mjs, not here.
// The Browserless function is n8n/browserless/extract-deals.js, inlined by the build.
const EXTRACT_CODE = ${JSON.stringify(extractCode)};
const CATEGORIES = ${JSON.stringify(CATEGORIES)};

if (!$env.PRODUCTS_IMPORT_TOKEN) {
  throw new Error("PRODUCTS_IMPORT_TOKEN is not set for n8n (see n8n/README.md)");
}

const pages = [
  { slug: "deals-all", name: "More deals", url: "https://www.amazon.com.br/deals" },
  ...CATEGORIES.map(([slug, name]) => ({
    slug: "deals-collection-" + slug,
    name,
    url: "https://www.amazon.com.br/deals?bubble-id=deals-collection-" + slug,
  })),
];

// Optional DEALS_CATEGORIES="tvs,books" (or "deals-all") limits the run
const only = String($env.DEALS_CATEGORIES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const selected = only.length
  ? pages.filter((p) => only.includes(p.slug) || only.includes(p.slug.replace("deals-collection-", "")))
  : pages;

return selected.map((page) => ({
  json: {
    category: { slug: page.slug, name: page.name },
    url: page.url,
    browserless: { code: EXTRACT_CODE, context: { url: page.url, scrolls: 4 } },
  },
}));`;

const batchesCode = `// Splits the extracted products into import requests of at most ${BATCH_SIZE}.
// A failed or empty page becomes one item without products, so the loop goes on.
const page = $('Each category').itemMatching(0).json;
const result = $input.first().json;
const products = Array.isArray(result.products) ? result.products : [];
const base = { category: page.category, found: products.length };

if (products.length === 0) {
  const error = result.error
    ? result.error.message || JSON.stringify(result.error)
    : "No deal cards found";
  return [{ json: { ...base, products: [], error } }];
}

const items = [];
for (let i = 0; i < products.length; i += ${BATCH_SIZE}) {
  items.push({ json: { ...base, products: products.slice(i, i + ${BATCH_SIZE}), error: null } });
}
return items;`;

const recordCode = `// One line per import request (or per failed page) for the final summary.
const batch = $('Make batches').item.json;
const response = $json;
const row = {
  category: batch.category.slug,
  found: batch.found,
  sent: batch.products.length,
  saved: 0,
  skipped: 0,
  error: batch.error,
};

if (batch.products.length > 0) {
  if (typeof response.saved === "number") {
    row.saved = response.saved;
    row.skipped = response.skipped.length;
    row.skippedReasons = response.skipped.slice(0, 5);
  } else {
    row.error = response.error
      ? response.error.message || JSON.stringify(response.error)
      : "Import request failed";
  }
}
return { json: row };`;

const summaryCode = `// Final summary: categories read, products sent and saved, failures.
const rows = $input.all().map((item) => item.json);
const byCategory = {};
for (const row of rows) {
  const c = (byCategory[row.category] ??= { category: row.category, found: row.found, sent: 0, saved: 0, skipped: 0, errors: [] });
  c.sent += row.sent;
  c.saved += row.saved;
  c.skipped += row.skipped;
  if (row.error) c.errors.push(row.error);
}
const categories = Object.values(byCategory);
const failed = categories.filter((c) => c.errors.length > 0);
const sum = (key) => categories.reduce((total, c) => total + c[key], 0);

return [{
  json: {
    categories: categories.length,
    succeeded: categories.length - failed.length,
    failed: failed.map((c) => ({ category: c.category, errors: c.errors })),
    productsFound: sum("found"),
    productsSent: sum("sent"),
    productsSaved: sum("saved"),
    productsSkipped: sum("skipped"),
    perCategory: categories.map(({ errors, ...c }) => c),
  },
}];`;

const nodes = [
  node("Run manually", "n8n-nodes-base.manualTrigger", 1, [0, 0], {}),
  // Optional daily run. It only fires while the workflow is published, and
  // `pnpm n8n:import` leaves it unpublished: manual import is the default
  // (specs/product.md). `pnpm n8n:schedule:on` / `:off` toggle it.
  node(
    "Every day at 00:00",
    "n8n-nodes-base.scheduleTrigger",
    1.2,
    [0, 200],
    {
      rule: {
        interval: [{ field: "cronExpression", expression: "0 0 * * *" }],
      },
    },
    {
      notes:
        "Off by default: runs only while the workflow is published (pnpm n8n:schedule:on)",
      notesInFlow: true,
    },
  ),
  node("Categories", "n8n-nodes-base.code", 2, [220, 100], {
    jsCode: categoriesCode,
  }),
  node("Each category", "n8n-nodes-base.splitInBatches", 3, [440, 100], {
    batchSize: 1,
    options: {},
  }),
  node(
    "Render deals page",
    "n8n-nodes-base.httpRequest",
    4.2,
    [660, 200],
    {
      method: "POST",
      url: "={{ $env.BROWSERLESS_URL }}/function?token={{ $env.BROWSERLESS_TOKEN }}",
      sendBody: true,
      specifyBody: "json",
      jsonBody: "={{ JSON.stringify($json.browserless) }}",
      options: {
        timeout: 150000,
        response: { response: { responseFormat: "json" } },
      },
    },
    {
      onError: "continueRegularOutput",
      retryOnFail: true,
      maxTries: 2,
      waitBetweenTries: 5000,
    },
  ),
  node("Make batches", "n8n-nodes-base.code", 2, [880, 200], {
    jsCode: batchesCode,
  }),
  node("Has products?", "n8n-nodes-base.if", 2.2, [1100, 200], {
    conditions: {
      options: {
        caseSensitive: true,
        leftValue: "",
        typeValidation: "strict",
        version: 2,
      },
      conditions: [
        {
          id: nodeId("Has products? condition"),
          leftValue: "={{ $json.products.length }}",
          rightValue: 0,
          operator: { type: "number", operation: "gt" },
        },
      ],
      combinator: "and",
    },
    options: {},
  }),
  node(
    "Send to app",
    "n8n-nodes-base.httpRequest",
    4.2,
    [1320, 120],
    {
      method: "POST",
      url: "={{ $env.APP_URL }}/api/v1/products/import",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          {
            name: "Authorization",
            value: "=Bearer {{ $env.PRODUCTS_IMPORT_TOKEN }}",
          },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody:
        "={{ JSON.stringify({ category: $json.category, products: $json.products }) }}",
      options: {
        timeout: 60000,
        response: { response: { responseFormat: "json" } },
      },
    },
    { onError: "continueRegularOutput" },
  ),
  node("Record result", "n8n-nodes-base.code", 2, [1540, 200], {
    mode: "runOnceForEachItem",
    jsCode: recordCode,
  }),
  node("Pause", "n8n-nodes-base.wait", 1.1, [1760, 200], {
    amount: PAUSE_SECONDS,
    unit: "seconds",
  }),
  node("Summary", "n8n-nodes-base.code", 2, [660, -40], {
    jsCode: summaryCode,
  }),
];

const to = (name, index = 0) => ({ node: name, type: "main", index });

const workflow = {
  id: WORKFLOW_ID,
  name: "Amazon deals import",
  nodes,
  connections: {
    "Run manually": { main: [[to("Categories")]] },
    "Every day at 00:00": { main: [[to("Categories")]] },
    Categories: { main: [[to("Each category")]] },
    // output 0 = done, output 1 = next category
    "Each category": { main: [[to("Summary")], [to("Render deals page")]] },
    "Render deals page": { main: [[to("Make batches")]] },
    "Make batches": { main: [[to("Has products?")]] },
    "Has products?": { main: [[to("Send to app")], [to("Record result")]] },
    "Send to app": { main: [[to("Record result")]] },
    "Record result": { main: [[to("Pause")]] },
    Pause: { main: [[to("Each category")]] },
  },
  settings: {
    executionOrder: "v1",
    timezone: "America/Sao_Paulo",
    saveManualExecutions: true,
  },
  active: false,
  pinData: {},
  meta: { templateCredsSetupCompleted: true },
  tags: [],
};

// Formatted with Biome, like the rest of the repo, so `pnpm lint` and --check agree
const json = execFileSync(
  join(root, "../node_modules/.bin/biome"),
  ["format", "--stdin-file-path=n8n/workflows/amazon-deals-import.json"],
  { input: JSON.stringify(workflow, null, 2), encoding: "utf8" },
);

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(output, "utf8");
  } catch {}
  if (current !== json) {
    console.error(
      "n8n/workflows/amazon-deals-import.json is out of date: run pnpm n8n:build",
    );
    process.exit(1);
  }
  console.log("Workflow JSON is up to date");
} else {
  writeFileSync(output, json);
  console.log(`Wrote ${output}`);
}
