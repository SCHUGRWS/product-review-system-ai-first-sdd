# Feedback (Product review)

## Scope
Frontend, backend, database

## Context
First version (delivered 2026-10-17): the user typed a product name, a rating and a comment.

Now feedback is always about a product from the catalog (`specs/product.md`). The user finds the product on '/home' and clicks "Give feedback" on its card. The feedback page shows that product, and the review slip preview prints its real title and image.
Required data:
- Product (chosen on the home page, not typed)
- Rating (1 to 5 stars)
- Comment

The author is always the signed-in user (`specs/sign-in.md`); the client never sends it.

## Functional requirements
1. Feedback page at '/products/<productId>/feedback'
    1. Only for signed-in users (otherwise redirect to '/auth/sign-in')
    2. Unknown product id: 404 page with a link back to '/home'
    3. Shows the product: image, title (link to Amazon), current price
    4. If the user already reviewed this product, the page says so and links to '/me' instead of showing the form
2. Add form validation on client side
    1. In case of a valid form send request to the API
3. Field rules (same schema on client and server)
    1. productId: required, must exist in 'products'
    2. rating: integer from 1 to 5
    3. comment: trimmed, 10 to 2000 characters
4. Database changes in table 'feedbacks'
    1. new column product_id: text (FK to `products.id`)
    2. product_name stays, filled by the server with the product title at the time of the review (a snapshot), so the review still reads well if the product changes
    3. one feedback per user per product (unique `account_id, product_id`)
    4. existing rows (from the first version) keep `product_id` empty
5. Request must be a POST to 'api/v1/feedback' with JSON body `{ productId, rating, comment }`. The session cookie authenticates it
6. HTTP codes (create)
    1. 201: Created, body `{ id, product: { id, title, imageUrl, url }, rating, comment, createdAt }`
    2. 400: Bad data format
    3. 401: Not signed in
    4. 404: Product not found
    5. 409: The user already reviewed this product
    6. 500: Unexpected server error
7. List the signed-in user's feedback, newest first, with the product (tRPC `feedback.listMine`)
8. `RecentFeedback` (shown on '/me') shows the product image and title for each review; old reviews without a product show the saved name. Each review with a product links to the product reviews page '/products/<id>' (`specs/product-reviews.md`)
9. The old page '/feedback/new' redirects to '/home'
10. Security
    1. A user can only create feedback as themselves and only list their own
    2. Any `accountId` or `productName` sent by the client is ignored
    3. The comment is rendered as text, never as HTML

## Non-Functional requirements
- UI/UX
    - Live preview: the review slip updates as the user types, with the product's real title and image
    - Accessible star rating, character counter (as in the first version)
- Performance
    - Product loaded on the server; the page streams behind `<Suspense>`

## Must do
- Migration altering `feedbacks`
- Update schema, procedures and REST endpoint for `productId`
- New feedback page per product; redirect from '/feedback/new'
- Update `RecentFeedback`
- Test and validations

## Must not do
- Edit or delete feedback
- Show the app's reviews on product cards (the product reviews page is `specs/product-reviews.md`)
- Import products or build the catalog page (`specs/product.md`, `specs/home.md`)
- Send any kind of email or notification

## Technologies (Stack)
- React.js
- Next.js
- React-Hook-Form
- shadcn
- Tailwind
- Supabase
- tRPC

## Acceptance criteria
- "Give feedback" on a product card opens '/products/<id>/feedback' showing that product
- The slip preview shows the product title, the stars and the user's name while typing
- On success a toast "Feedback posted" is shown, with a "See all reviews" action that opens the product reviews page '/products/<id>', and the user goes to '/me', where the review appears first with the product image and title
- Reviewing the same product again is blocked (page message, and 409 from the API)
- Unknown product shows a 404 page
- '/feedback/new' redirects to '/home'

## Results
Users review real products they find in the catalog, one review per product.
