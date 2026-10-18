// Step 2: create synthetic accounts and ~1,000 feedbacks (comments written by
// OpenAI gpt-4.1-nano) into accounts.json / feedbacks.json. Run once; the
// output is committed and turned into SQL by build-migration.mjs.
// Resumable: comments already in comments-cache.json are not requested again.
// Usage: node scripts/demo-data/generate.mjs   (reads OPENAI_API_KEY from .env.local)

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";

const DIR = new URL(".", import.meta.url).pathname;
const ROOT = new URL("../../", import.meta.url).pathname;
const read = (f) => JSON.parse(readFileSync(DIR + f, "utf8"));
const write = (f, d) =>
  writeFileSync(DIR + f, `${JSON.stringify(d, null, 1)}\n`);

// Seeded PRNG so the plan (products, ratings, dates) is reproducible
let seed = 20261018;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rand() * a.length)];
const _int = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const unusableHash = () =>
  bcrypt
    .hash(randomBytes(32).toString("base64"), 12)
    .then((h) => ({ password: h, salt: h.slice(0, 29) }));

const products = read("products.json");
const existing = read("existing-demo.json");

// ---- accounts ----------------------------------------------------------------
let accounts;
if (existsSync(`${DIR}accounts.json`)) accounts = read("accounts.json");
else {
  const FIRST = [
    "Ana",
    "Beatriz",
    "Bruna",
    "Camila",
    "Carolina",
    "Daniela",
    "Fernanda",
    "Gabriela",
    "Isabela",
    "Juliana",
    "Larissa",
    "Letícia",
    "Mariana",
    "Natália",
    "Patrícia",
    "Priscila",
    "Rafaela",
    "Renata",
    "Tatiane",
    "Vanessa",
    "Aline",
    "Luana",
    "Débora",
    "Sabrina",
    "Rodrigo",
    "Lucas",
    "Gabriel",
    "Matheus",
    "Pedro",
    "Gustavo",
    "Thiago",
    "Rafael",
    "Leonardo",
    "Felipe",
    "Bruno",
    "Eduardo",
    "Marcelo",
    "Fábio",
    "André",
    "João",
    "Vinícius",
    "Caio",
    "Otávio",
    "Henrique",
    "Diego",
    "Leandro",
    "Murilo",
    "Paulo",
  ];
  const LAST = [
    "Silva",
    "Santos",
    "Oliveira",
    "Souza",
    "Rodrigues",
    "Ferreira",
    "Alves",
    "Pereira",
    "Lima",
    "Gomes",
    "Ribeiro",
    "Carvalho",
    "Araújo",
    "Martins",
    "Rocha",
    "Barbosa",
    "Cardoso",
    "Moreira",
    "Teixeira",
    "Correia",
    "Nascimento",
    "Moraes",
    "Freitas",
    "Cavalcanti",
    "Dias",
    "Castro",
    "Campos",
    "Pinto",
    "Monteiro",
    "Mendes",
    "Batista",
    "Vieira",
    "Azevedo",
    "Fonseca",
    "Machado",
    "Nogueira",
  ];
  const ascii = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const seen = new Set();
  const people = [];
  while (people.length < 60) {
    const f = pick(FIRST),
      l = pick(LAST);
    if (!seen.has(f + l)) {
      seen.add(f + l);
      people.push([f, l]);
    }
  }
  accounts = [];
  const pub = await bcrypt.hash("demo-review-2026", 12);
  accounts.push({
    id: nanoid(),
    first_name: "Demo",
    last_name: "Visitor",
    email: "demo@example.com",
    password: pub,
    salt: pub.slice(0, 29),
    active: true,
    created_at: "2026-06-01T12:00:00.000Z",
    role: "public-demo",
  });
  for (const a of existing.accounts)
    accounts.push({ ...a, ...(await unusableHash()), role: "existing-demo" });
  for (const [i, [f, l]] of people.entries())
    accounts.push({
      id: nanoid(),
      first_name: f,
      last_name: l,
      email: `${ascii(f)}.${ascii(l)}.${i + 1}@example.com`,
      ...(await unusableHash()),
      active: true,
      created_at: null,
      role: "reviewer",
    });
  write("accounts.json", accounts);
}
const reviewers = accounts.filter((a) => a.role === "reviewer");

// ---- plan: products, ratings, authors, dates -------------------------------------
seed = 4242; // reseed: the plan must not depend on whether accounts.json existed
const START = Date.parse("2026-06-19T12:00:00Z"),
  END = Date.parse("2026-10-17T18:00:00Z"); // 120 days
const reviewedByDemo = new Set(existing.feedbacks.map((f) => f.product_id));
const byCat = Object.groupBy(
  products.filter((p) => p.title.length >= 15),
  (p) => p.category_slug,
);
const chosen = [];
for (const [, list] of Object.entries(byCat).sort()) {
  const demoFirst = shuffle(list).sort(
    (a, b) => reviewedByDemo.has(b.id) - reviewedByDemo.has(a.id),
  );
  chosen.push(...demoFirst.slice(0, 28));
}
const RATINGS = {
  positive: [5, 5, 5, 5, 4, 4, 4, 3],
  mixed: [5, 4, 3, 3, 3, 2, 2, 1],
  negative: [1, 1, 2, 2, 2, 3, 3, 4],
};
const plan = chosen.map((p) => {
  const r = rand();
  const profile = r < 0.66 ? "positive" : r < 0.88 ? "mixed" : "negative";
  const n = Math.min(12, Math.max(3, Math.round(3 + rand() ** 3 * 9)));
  const authors = shuffle(reviewers).slice(0, n);
  return {
    product_id: p.id,
    title: p.title,
    category: p.category_name,
    profile,
    reviews: authors.map((a) => ({
      account_id: a.id,
      rating: pick(RATINGS[profile]),
      created_at: new Date(START + rand() * (END - START)).toISOString(),
    })),
  };
});
write("plan.json", plan);
if (process.env.PLAN_ONLY) {
  console.log({
    products: plan.length,
    reviews: plan.reduce((n, p) => n + p.reviews.length, 0),
    profiles: Object.fromEntries(
      Object.entries(Object.groupBy(plan, (p) => p.profile)).map(([k, v]) => [
        k,
        v.length,
      ]),
    ),
  });
  process.exit(0);
}

// ---- comments via OpenAI ---------------------------------------------------------
const key = readFileSync(`${ROOT}.env.local`, "utf8")
  .match(/^OPENAI_API_KEY=(.*)$/m)?.[1]
  ?.trim()
  .replace(/^["']|["']$/g, "");
if (!key) throw new Error("OPENAI_API_KEY missing in .env.local");
const cache = existsSync(`${DIR}comments-cache.json`)
  ? read("comments-cache.json")
  : {};
const usage = existsSync(`${DIR}usage.json`)
  ? read("usage.json")
  : { requests: 0, prompt_tokens: 0, completion_tokens: 0 };
const MAX_REQUESTS = 150;
const BATCH = Number(process.env.BATCH ?? 10);
const Comment = z
  .string()
  .trim()
  .min(10)
  .max(600)
  .refine((s) => !/https?:\/\/|www\.|\S+@\S+\.\S+/i.test(s), "no urls/emails");
const TONES = [
  "curto e direto",
  "detalhado",
  "entusiasmado",
  "prático, foco no uso diário",
  "compara com o que tinha antes",
  "comprou de presente",
  "comenta custo-benefício",
  "informal",
  "comedido",
  "cita um detalhe específico",
  "decepcionado",
  "menciona a entrega ou embalagem",
];

async function requestBatch(batch) {
  if (usage.requests >= MAX_REQUESTS) throw new Error("request cap reached");
  usage.requests++;
  const items = batch.map((p, i) => ({
    key: `p${i}`,
    titulo: p.title.slice(0, 300),
    categoria: p.category,
    avaliacoes: p.reviews.map((r, j) => ({
      id: `p${i}-${j}`,
      nota: r.rating,
      tom: pick(TONES),
    })),
  }));
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      temperature: 1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você escreve avaliações realistas de clientes brasileiros para produtos de uma loja online. Responda só com JSON.",
        },
        {
          role: "user",
          content: `Para cada avaliação de cada produto (identificada por "id"), escreva um comentário em português do Brasil. Responda TODOS os ids, sem pular nenhum.
Regras: 1 a 3 frases (até 350 caracteres); o texto deve combinar com a nota (1 = muito ruim, 5 = excelente) e com o tom indicado; cite aspectos concretos e plausíveis do produto pelo título (material, tamanho, sabor, leitura, bateria, etc.); varie começos e vocabulário, sem frases genéricas repetidas; não repita o título inteiro; sem links, e-mails, emojis ou hashtags.
Formato: {"comentarios":{"p0-0":"...","p0-1":"...","p1-0":"..."}}
Produtos: ${JSON.stringify(items)}`,
        },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(
      `OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  const body = await res.json();
  usage.prompt_tokens += body.usage.prompt_tokens;
  usage.completion_tokens += body.usage.completion_tokens;
  if (process.env.DEBUG_RAW)
    console.log(
      body.choices[0].finish_reason,
      body.choices[0].message.content.slice(0, 1500),
    );
  let parsed;
  try {
    parsed = JSON.parse(body.choices[0].message.content);
  } catch {
    if (process.env.DEBUG)
      console.log("bad json", body.choices[0].finish_reason);
    return 0;
  }
  let ok = 0;
  for (const [i, p] of batch.entries()) {
    const got = p.reviews.map(
      (_, j) => parsed?.comentarios?.[`p${i}-${j}`] ?? parsed?.[`p${i}-${j}`],
    );
    const r = z.array(Comment).length(p.reviews.length).safeParse(got);
    if (r.success && new Set(r.data).size === r.data.length) {
      cache[p.product_id] = r.data;
      ok++;
    } else if (process.env.DEBUG)
      console.log(
        "invalid",
        p.reviews.length,
        got.filter(Boolean).length,
        r.error?.issues?.[0]?.message ?? "duplicates",
      );
  }
  return ok;
}

for (let attempt = 0; attempt < (process.env.ONE_PASS ? 1 : 2); attempt++) {
  // first pass + one retry for invalid products
  const todo = plan.filter((p) => !cache[p.product_id]);
  for (
    let i = 0;
    i < Math.min(todo.length, Number(process.env.LIMIT ?? Infinity));
    i += BATCH
  ) {
    const batch = todo.slice(i, i + BATCH);
    const ok = await requestBatch(batch);
    write("comments-cache.json", cache);
    write("usage.json", usage);
    console.log(`request ${usage.requests}: ${ok}/${batch.length} products ok`);
  }
}

// ---- feedbacks.json ----------------------------------------------------------------
const old = existsSync(`${DIR}feedbacks.json`)
  ? Object.fromEntries(
      read("feedbacks.json").map((f) => [
        `${f.account_id}|${f.product_id}`,
        f.id,
      ]),
    )
  : {};
const feedbacks = [];
for (const p of plan) {
  const comments = cache[p.product_id];
  if (!comments) {
    console.warn("skipped (no comments):", p.product_id);
    continue;
  }
  p.reviews.forEach((r, i) => {
    feedbacks.push({
      id: old[`${r.account_id}|${p.product_id}`] ?? nanoid(),
      account_id: r.account_id,
      product_id: p.product_id,
      product_name: p.title.slice(0, 500),
      rating: r.rating,
      comment: comments[i],
      created_at: r.created_at,
    });
  });
}
feedbacks.sort((a, b) => a.created_at.localeCompare(b.created_at));
// reviewer accounts are "created" a few days before their first review
for (const a of reviewers) {
  const first =
    feedbacks.find((f) => f.account_id === a.id)?.created_at ??
    new Date(END).toISOString();
  a.created_at = new Date(
    Date.parse(first) - (1 + (a.id.charCodeAt(0) % 20)) * 86400000,
  ).toISOString();
}
write("accounts.json", accounts);
write("feedbacks.json", feedbacks);
const cost = (usage.prompt_tokens * 0.1 + usage.completion_tokens * 0.4) / 1e6;
console.log({
  products: plan.length,
  feedbacks: feedbacks.length,
  ...usage,
  est_cost_usd: cost.toFixed(4),
});
