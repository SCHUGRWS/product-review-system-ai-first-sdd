# Home (Product catalog) and personal page

## Scope
Frontend, backend

## Context
First version (delivered 2026-10-17): `/home` showed the signed-in user's greeting, account, recent feedback and sign-out.

Now `/home` becomes the product catalog. It shows lists of products imported from Amazon deals (`specs/product.md`) and a search, so the user can find the product they want to review. The previous content moves to a personal page at `/me`. Its "Write feedback" button now leads to `/home`, where the user picks the product.

## Functional requirements
1. Both pages are only for signed-in users. Without a valid session the user is redirected to '/auth/sign-in' (checked on the server with `requireUser()`)
2. Shared header for signed-in pages
    1. Product name linking to '/home'
    2. Navigation: "Products" ('/home') and "My page" ('/me'), with the current page marked (`aria-current`)
    3. The user's short name ("Ada L.") and "Sign out"
3. '/home': catalog
    1. A search field at the top ("Search products")
    2. Without a search, several horizontal lists of product cards (scrollable, keyboard accessible). "Available" products are those of the latest import: seen within 3 days before the most recent import, however long ago it ran (`specs/product.md`, requirement 5). Lists, category pages, search and category counts use this rule:
        1. "Biggest discounts": available products with the highest discount
        2. "Top rated": available products with the best Amazon rating (at least 50 reviews)
        3. One list per category with available products ("TVs", "Video games", "Books", ...), ordered by the number of products
    3. Each list shows up to 20 products; category lists have a "See all" link to '/home?category=<slug>' (the discount and rating lists have no page of their own)
    4. Category view '/home?category=<slug>': grid with all available products of the category, sorted by discount, 24 per page
    5. Search '/home?q=<text>': grid of results, paginated, with the number of results and an empty state ("No products match …") that suggests clearing the search
    6. The search text and the category live in the URL, so results can be shared and the back button works
    7. Every product uses the product card from `specs/product.md`: title links to Amazon, "Give feedback" opens the feedback page; the app's review count and average come first, Amazon's rating second and labelled (loaded with one query per list or grid)
    8. Empty catalog (no import yet): a message explaining that products appear after the import runs
4. '/me': personal page (the former home)
    1. Greeting "Welcome back, <First name>"
    2. "Write feedback" button linking to '/home' (and focusing the search)
    3. "Your recent feedback" (`RecentFeedback` from `specs/feedback.md`, now with the product)
    4. Account summary: full name, email, "Member since <Month YYYY>"
5. After sign-in the user lands on '/home' (unchanged)

## Non-Functional requirements
- UI/UX
    - Same identity ("review slip", cobalt two-ink, Schibsted Grotesk). Product cards stay quiet; the slip stays the signature element
    - Responsive: lists scroll horizontally with snap; grids go from 2 columns (mobile) to 5 (desktop); no page-level horizontal scroll
    - Accessible: each list is a labelled region; the search has a label; results count announced politely
- Performance
    - Static shell prerendered; lists stream in behind `<Suspense>` with skeletons
    - Images lazy loaded with fixed size (no layout shift)

## Must do
- New '/home' catalog page (lists, category view, search)
- Move the current home content to '/me'
- Header navigation
- Test and validations

## Must not do
- Import or store products (`specs/product.md`)
- Implement the feedback form (`specs/feedback.md`)
- Filters beyond category (price, brand) or sorting controls
- Change the public landing page '/'

## Technologies (Stack)
- React.js
- Next.js (Cache Components, `<Suspense>`, `searchParams`)
- shadcn
- Tailwind
- tRPC + React Query
- date-fns

## Acceptance criteria
- '/home' shows "Biggest discounts", "Top rated" and category lists with real imported products
- Searching "smart tv" shows matching products; clearing the search shows the lists again
- "See all" opens the category grid
- A product title opens the Amazon page in a new tab; "Give feedback" opens the feedback page of that product
- '/me' shows the greeting, account, recent feedback and a "Write feedback" link to '/home'
- Both pages redirect to '/auth/sign-in' without a session

## Results
Signed-in users browse and search real products, and pick one to review; their personal page keeps their account and reviews.
