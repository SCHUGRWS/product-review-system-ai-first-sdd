// Fake products in the shape the n8n workflow sends to POST /api/v1/products/import.
// Real Amazon image URLs (allowed by next.config.ts), fake ASINs prefixed with "E2E".
export type RawProduct = {
  asin: string;
  title: string;
  url: string;
  imageUrl: string;
  price: string;
  listPrice: string | null;
  discountPercent: number | null;
  rating: string | null;
  reviewCount: string | null;
};

export type ImportBatch = {
  category: { slug: string; name: string };
  products: RawProduct[];
};

export const productBatches: ImportBatch[] = [
  {
    category: { slug: "deals-collection-tvs", name: "TVs" },
    products: [
      {
        asin: "E2E0000001",
        title: 'Smart TV LG 55" 4K UHD',
        url: "https://www.amazon.com.br/produto/dp/E2E0000001?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
        price: "R$ 336,90",
        listPrice: "R$ 453,90",
        discountPercent: 26,
        rating: "3,9",
        reviewCount: "(48)",
      },
      {
        asin: "E2E0000002",
        title: 'Smart TV Philips 65" Ambilight',
        url: "https://www.amazon.com.br/produto/dp/E2E0000002?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41N27jdY9WL._AC_SF226,226_QL85_.jpg",
        price: "R$ 473,90",
        listPrice: "R$ 709,90",
        discountPercent: 33,
        rating: "4,3",
        reviewCount: "(75)",
      },
      {
        asin: "E2E0000003",
        title: 'Smart TV Samsung 50" Crystal UHD',
        url: "https://www.amazon.com.br/produto/dp/E2E0000003?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41Y0BD0IUXL._AC_SF226,226_QL85_.jpg",
        price: "R$ 610,90",
        listPrice: "R$ 1.006,90",
        discountPercent: 39,
        rating: "4,7",
        reviewCount: "(230)",
      },
      {
        asin: "E2E0000004",
        title: 'Smart TV TCL 43" QLED',
        url: "https://www.amazon.com.br/produto/dp/E2E0000004?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41fK4Fj6H9L._AC_SF226,226_QL85_.jpg",
        price: "R$ 747,90",
        listPrice: "R$ 1.344,90",
        discountPercent: 44,
        rating: "3,5",
        reviewCount: "(1.234)",
      },
      {
        asin: "E2E0000005",
        title: 'Smart TV LG 85" QNED Mini LED',
        url: "https://www.amazon.com.br/produto/dp/E2E0000005?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg",
        price: "R$ 884,90",
        listPrice: "R$ 1.060,90",
        discountPercent: 17,
        rating: "3,9",
        reviewCount: "(8)",
      },
      {
        asin: "E2E0000006",
        title: 'Smart TV Philco 32" HD',
        url: "https://www.amazon.com.br/produto/dp/E2E0000006?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/51-NkMboU4L._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.021,90",
        listPrice: "R$ 1.378,90",
        discountPercent: 26,
        rating: "4,3",
        reviewCount: "(560)",
      },
      {
        asin: "E2E0000007",
        title: 'Smart TV AOC 40" Full HD',
        url: "https://www.amazon.com.br/produto/dp/E2E0000007?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/511jn4zTQDL._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.158,90",
        listPrice: "R$ 1.737,90",
        discountPercent: 33,
        rating: "4,7",
        reviewCount: "(95)",
      },
      {
        asin: "E2E0000008",
        title: 'Smart TV Hisense 58" 4K',
        url: "https://www.amazon.com.br/produto/dp/E2E0000008?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/417thq90z2L._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.295,90",
        listPrice: "R$ 2.136,90",
        discountPercent: 39,
        rating: "3,5",
        reviewCount: "(12)",
      },
    ],
  },
  {
    category: { slug: "deals-collection-video-games", name: "Video games" },
    products: [
      {
        asin: "E2E0000009",
        title: "Console Nintendo Switch 2",
        url: "https://www.amazon.com.br/produto/dp/E2E0000009?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.432,90",
        listPrice: "R$ 2.577,90",
        discountPercent: 44,
        rating: "3,9",
        reviewCount: "(48)",
      },
      {
        asin: "E2E0000010",
        title: "Controle DualSense Branco",
        url: "https://www.amazon.com.br/produto/dp/E2E0000010?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41N27jdY9WL._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.569,90",
        listPrice: "R$ 1.882,90",
        discountPercent: 17,
        rating: "4,3",
        reviewCount: "(75)",
      },
      {
        asin: "E2E0000011",
        title: "Headset Gamer HyperX Cloud",
        url: "https://www.amazon.com.br/produto/dp/E2E0000011?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41Y0BD0IUXL._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.706,90",
        listPrice: "R$ 2.303,90",
        discountPercent: 26,
        rating: "4,7",
        reviewCount: "(230)",
      },
      {
        asin: "E2E0000012",
        title: "Jogo Mario Kart World",
        url: "https://www.amazon.com.br/produto/dp/E2E0000012?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41fK4Fj6H9L._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.843,90",
        listPrice: "R$ 2.764,90",
        discountPercent: 33,
        rating: "3,5",
        reviewCount: "(1.234)",
      },
      {
        asin: "E2E0000013",
        title: "Console Xbox Series S 512GB",
        url: "https://www.amazon.com.br/produto/dp/E2E0000013?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg",
        price: "R$ 1.980,90",
        listPrice: "R$ 3.267,90",
        discountPercent: 39,
        rating: "3,9",
        reviewCount: "(8)",
      },
      {
        asin: "E2E0000014",
        title: "Volante Logitech G29",
        url: "https://www.amazon.com.br/produto/dp/E2E0000014?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/51-NkMboU4L._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.117,90",
        listPrice: "R$ 3.810,90",
        discountPercent: 44,
        rating: "4,3",
        reviewCount: "(560)",
      },
      {
        asin: "E2E0000015",
        title: "Jogo EA Sports FC 26",
        url: "https://www.amazon.com.br/produto/dp/E2E0000015?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/511jn4zTQDL._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.254,90",
        listPrice: "R$ 2.704,90",
        discountPercent: 17,
        rating: "4,7",
        reviewCount: "(95)",
      },
      {
        asin: "E2E0000016",
        title: "Cartão microSD 256GB para Switch",
        url: "https://www.amazon.com.br/produto/dp/E2E0000016?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/417thq90z2L._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.391,90",
        listPrice: "R$ 3.227,90",
        discountPercent: 26,
        rating: "3,5",
        reviewCount: "(12)",
      },
    ],
  },
  {
    category: { slug: "deals-collection-kitchen", name: "Cozinha" },
    products: [
      {
        asin: "E2E0000017",
        title: "Air Fryer Mondial 5L",
        url: "https://www.amazon.com.br/produto/dp/E2E0000017?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.528,90",
        listPrice: "R$ 3.792,90",
        discountPercent: 33,
        rating: "3,9",
        reviewCount: "(48)",
      },
      {
        asin: "E2E0000018",
        title: "Liquidificador Oster 1400W",
        url: "https://www.amazon.com.br/produto/dp/E2E0000018?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41N27jdY9WL._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.665,90",
        listPrice: "R$ 4.397,90",
        discountPercent: 39,
        rating: "4,3",
        reviewCount: "(75)",
      },
      {
        asin: "E2E0000019",
        title: "Cafeteira Nespresso Vertuo",
        url: "https://www.amazon.com.br/produto/dp/E2E0000019?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41Y0BD0IUXL._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.802,90",
        listPrice: "R$ 5.043,90",
        discountPercent: 44,
        rating: "4,7",
        reviewCount: "(230)",
      },
      {
        asin: "E2E0000020",
        title: "Panela de Pressão Elétrica 6L",
        url: "https://www.amazon.com.br/produto/dp/E2E0000020?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41fK4Fj6H9L._AC_SF226,226_QL85_.jpg",
        price: "R$ 2.939,90",
        listPrice: "R$ 3.526,90",
        discountPercent: 17,
        rating: "3,5",
        reviewCount: "(1.234)",
      },
      {
        asin: "E2E0000021",
        title: "Jogo de Facas Tramontina 6 peças",
        url: "https://www.amazon.com.br/produto/dp/E2E0000021?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.076,90",
        listPrice: "R$ 4.152,90",
        discountPercent: 26,
        rating: "3,9",
        reviewCount: "(8)",
      },
      {
        asin: "E2E0000022",
        title: "Lixeira Cozinha 30 Litros com Pedal",
        url: "https://www.amazon.com.br/produto/dp/E2E0000022?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/51-NkMboU4L._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.213,90",
        listPrice: "R$ 4.819,90",
        discountPercent: 33,
        rating: "4,3",
        reviewCount: "(560)",
      },
      {
        asin: "E2E0000023",
        title: "Chaleira Elétrica Inox 1,7L",
        url: "https://www.amazon.com.br/produto/dp/E2E0000023?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/511jn4zTQDL._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.350,90",
        listPrice: "R$ 5.527,90",
        discountPercent: 39,
        rating: "4,7",
        reviewCount: "(95)",
      },
      {
        asin: "E2E0000024",
        title: "Mixer de Mão 3 em 1",
        url: "https://www.amazon.com.br/produto/dp/E2E0000024?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/417thq90z2L._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.487,90",
        listPrice: "R$ 6.276,90",
        discountPercent: 44,
        rating: "3,5",
        reviewCount: "(12)",
      },
    ],
  },
  {
    category: { slug: "deals-collection-books", name: "Livros" },
    products: [
      {
        asin: "E2E0000025",
        title: "Box Harry Potter Edição Premium",
        url: "https://www.amazon.com.br/produto/dp/E2E0000025?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.624,90",
        listPrice: "R$ 4.348,90",
        discountPercent: 17,
        rating: "3,9",
        reviewCount: "(48)",
      },
      {
        asin: "E2E0000026",
        title: "O Hobbit Edição Ilustrada",
        url: "https://www.amazon.com.br/produto/dp/E2E0000026?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41N27jdY9WL._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.761,90",
        listPrice: "R$ 5.077,90",
        discountPercent: 26,
        rating: "4,3",
        reviewCount: "(75)",
      },
      {
        asin: "E2E0000027",
        title: "Hábitos Atômicos",
        url: "https://www.amazon.com.br/produto/dp/E2E0000027?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41Y0BD0IUXL._AC_SF226,226_QL85_.jpg",
        price: "R$ 3.898,90",
        listPrice: "R$ 5.847,90",
        discountPercent: 33,
        rating: "4,7",
        reviewCount: "(230)",
      },
      {
        asin: "E2E0000028",
        title: "A Biblioteca da Meia-Noite",
        url: "https://www.amazon.com.br/produto/dp/E2E0000028?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41fK4Fj6H9L._AC_SF226,226_QL85_.jpg",
        price: "R$ 4.035,90",
        listPrice: "R$ 6.657,90",
        discountPercent: 39,
        rating: "3,5",
        reviewCount: "(1.234)",
      },
      {
        asin: "E2E0000029",
        title: "Sapiens: Uma Breve História da Humanidade",
        url: "https://www.amazon.com.br/produto/dp/E2E0000029?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/41xYBNh9mTL._AC_SF226,226_QL85_.jpg",
        price: "R$ 4.172,90",
        listPrice: "R$ 7.509,90",
        discountPercent: 44,
        rating: "3,9",
        reviewCount: "(8)",
      },
      {
        asin: "E2E0000030",
        title: "Torto Arado",
        url: "https://www.amazon.com.br/produto/dp/E2E0000030?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/51-NkMboU4L._AC_SF226,226_QL85_.jpg",
        price: "R$ 4.309,90",
        listPrice: "R$ 5.170,90",
        discountPercent: 17,
        rating: "4,3",
        reviewCount: "(560)",
      },
      {
        asin: "E2E0000031",
        title: "O Pequeno Príncipe Capa Dura",
        url: "https://www.amazon.com.br/produto/dp/E2E0000031?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/511jn4zTQDL._AC_SF226,226_QL85_.jpg",
        price: "R$ 4.446,90",
        listPrice: "R$ 6.002,90",
        discountPercent: 26,
        rating: "4,7",
        reviewCount: "(95)",
      },
      {
        asin: "E2E0000032",
        title: "Duna Edição Especial",
        url: "https://www.amazon.com.br/produto/dp/E2E0000032?ref=e2e",
        imageUrl:
          "https://m.media-amazon.com/images/I/417thq90z2L._AC_SF226,226_QL85_.jpg",
        price: "R$ 4.583,90",
        listPrice: "R$ 6.874,90",
        discountPercent: 33,
        rating: "3,5",
        reviewCount: "(12)",
      },
    ],
  },
];

// A category with more products than one grid page (24), only for pagination
// (home.spec.ts). Nobody else imports into it, so the counts stay exact.
export const PAGING_CATEGORY = {
  slug: "deals-collection-e2e-paging",
  name: "Paging test",
};
export const pagingBatch: ImportBatch = {
  category: PAGING_CATEGORY,
  products: Array.from({ length: 30 }, (_, i) => {
    const n = String(i + 1).padStart(6, "0");
    return {
      asin: `E2EP${n}`,
      title: `Caderno Espiral Paginação ${i + 1}`,
      url: `https://www.amazon.com.br/produto/dp/E2EP${n}`,
      imageUrl:
        "https://m.media-amazon.com/images/I/41GPp28c-bL._AC_SF226,226_QL85_.jpg",
      price: "R$ 19,90",
      listPrice: "R$ 29,90",
      discountPercent: 33,
      rating: "4,1",
      reviewCount: "(10)",
    };
  }),
};

/** Everything the global setup imports once, before any spec runs */
export const sharedBatches: ImportBatch[] = [...productBatches, pagingBatch];

// Products a single test creates for itself (e2e/helpers.ts, importOwnProduct)
// land here, apart from the shared fixtures above.
export const OWN_PRODUCTS_CATEGORY = {
  slug: "deals-collection-e2e-own",
  name: "E2E own products",
};
