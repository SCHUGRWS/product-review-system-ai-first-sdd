// English UI copy (default locale). Keys are grouped by feature: "reviews.title".
// Placeholders use {name}. pt-BR must have exactly the same keys (specs/i18n.md);
// its type makes a missing or extra key a compile error.
export const en = {
  // Page titles ("<title> | Product Review System") and the site description
  "meta.description": "Share and discover product reviews",
  "meta.signIn": "Sign in",
  "meta.signUp": "Sign up",
  "meta.signUpSuccess": "Account created",
  "meta.home": "Products",
  "meta.me": "My page",
  "meta.feedback": "Write feedback",
  "meta.reviews": "Reviews",
  "meta.notFound": "Page not found",

  // Shared by several screens
  "common.you": "you",
  "common.reviewBy": "Review by",
  "common.starsLabel": "{rating} out of 5 stars",
  "common.opensAmazon": "(opens Amazon)",
  "common.currentPrice": "Current price",

  // Header of signed-in pages
  "nav.label": "Main",
  "nav.products": "Products",
  "nav.me": "My page",
  "nav.signedInAs": "Signed in as",
  "nav.signOut": "Sign out",
  "nav.signingOut": "Signing out...",

  // Landing page (/)
  "landing.title": "Reviews from people who actually bought it.",
  "landing.lead":
    "Read what owners say after weeks of real use, and post your own when a product earns it.",
  "landing.signUp": "Create an account",
  "landing.signIn": "Sign in",
  "landing.slip1.product": "Cordless vacuum, 2nd generation",
  "landing.slip1.detail": "Owned 1 year",
  "landing.slip1.quote":
    "Strong suction, but the battery fades halfway through the stairs.",
  "landing.slip2.product": "Stainless steel kettle, 1.7 L",
  "landing.slip2.detail": "Owned 3 months",
  "landing.slip2.quote":
    "Boils fast and the lid doesn't drip. The handle gets warm after two cups, so I knocked off a star.",

  // Sign-in and sign-up (specs/sign-in.md, specs/sign-up.md)
  "auth.field.email": "Email",
  "auth.field.password": "Password",
  "auth.field.firstName": "First name",
  "auth.field.lastName": "Last name",
  "auth.field.confirmPassword": "Confirm password",
  "auth.passwordHint": "At least 8 characters",
  "auth.signIn.title": "Welcome back",
  "auth.signIn.lead": "Sign in to post a review or pick up where you left off.",
  "auth.signIn.submit": "Sign in",
  "auth.signIn.pending": "Signing in...",
  "auth.signIn.noAccount": "No account yet?",
  "auth.signIn.createOne": "Create one",
  "auth.signIn.slip.product": "Ceramic pour-over dripper",
  "auth.signIn.slip.detail": "Owned 6 months",
  "auth.signIn.slip.quote":
    "Six months in, it still makes the best cup in the house. Slow to pour, but that is the point.",
  "auth.signUp.title": "Create your account",
  "auth.signUp.lead": "Your name appears on every review you post.",
  "auth.signUp.submit": "Create account",
  "auth.signUp.pending": "Creating account...",
  "auth.signUp.haveAccount": "Already have an account?",
  "auth.signUp.signIn": "Sign in",
  "auth.signUp.slip.product": "Noise-cancelling headphones",
  "auth.signUp.slip.detail": "Owned 2 months",
  "auth.signUp.slip.quote":
    "Quiet on the train and comfortable for a full workday. The case is bulkier than it needs to be.",
  "auth.success.slipProduct": "Your first review",
  "auth.success.stampLine1": "Account",
  "auth.success.stampLine2": "created",
  "auth.success.title": "Your account is ready",
  "auth.success.body": "Reviews you write will appear under your name.",
  "auth.success.cta": "Sign in",

  // Form validation (the zod schemas return these keys)
  "validation.email.required": "Email is required",
  "validation.email.invalid": "Enter a valid email address",
  "validation.password.required": "Password is required",
  "validation.password.min":
    "Password must have at least {passwordMin} characters",
  "validation.password.tooLong": "Password is too long",
  "validation.firstName.required": "First name is required",
  "validation.firstName.max":
    "First name must have at most {nameMax} characters",
  "validation.lastName.required": "Last name is required",
  "validation.lastName.max": "Last name must have at most {nameMax} characters",
  "validation.confirmPassword.required": "Confirm your password",
  "validation.confirmPassword.mismatch": "Passwords do not match",
  "validation.product.required": "Choose a product to review",
  "validation.rating.required": "Choose a rating",
  "validation.rating.int": "Rating must be a whole number of stars",
  "validation.rating.max": "Rating must be at most 5 stars",
  "validation.comment.required": "Comment is required",
  "validation.comment.min":
    "Comment must have at least {commentMin} characters",
  "validation.comment.max": "Comment must have at most {commentMax} characters",

  // Server errors (tRPC sends the key; the REST API keeps the English text)
  "errors.generic": "Something went wrong. Please try again later.",
  "errors.validation": "Some fields are invalid",
  "errors.signInRequired": "Sign in to continue",
  "errors.accessDenied": "Access denied",
  "errors.invalidCredentials": "Invalid email or password",
  "errors.emailTaken": "This email is already registered",
  "errors.signUpFailed":
    "Could not create the account. Please try again later.",
  "errors.signInFailed": "Could not sign in. Please try again later.",
  "errors.signOutFailed": "Could not sign out. Please try again later.",
  "errors.alreadyReviewed": "You already reviewed this product",
  "errors.productNotFound": "Product not found",
  "errors.postFailed": "Could not post the feedback. Please try again later.",
  "errors.listMineFailed":
    "Could not load your feedback. Please try again later.",
  "errors.hasReviewedFailed":
    "Could not check your feedback. Please try again later.",
  "errors.reviewsFailed": "Could not load the reviews. Please try again later.",
  "errors.localeFailed": "Could not save the language. Please try again later.",

  // Catalog (/home, specs/home.md)
  "catalog.title": "Pick a product you have used",
  "catalog.lead":
    "Today's Amazon deals, refreshed every night. Find what you bought and tell other people how it held up.",
  "catalog.search.label": "Search products",
  "catalog.search.placeholder": "Smart TV, air fryer, a book title…",
  "catalog.search.submit": "Search",
  "catalog.search.clear": "Clear search",
  "catalog.queryTooShort": "Type at least {min} characters to search.",
  "catalog.loadError":
    "Could not load these products. Refresh the page to try again.",
  "catalog.loadErrorTitle": "Could not load the catalog",
  "catalog.loadingList": "Loading {title}",
  "catalog.loadingProducts": "Loading products",
  "catalog.mostReviewed.title": "Most reviewed here",
  "catalog.mostReviewed.description":
    "Products our community has reviewed the most",
  "catalog.discounts.title": "Biggest discounts",
  "catalog.discounts.description": "The deepest price cuts in today's deals",
  "catalog.topRated.title": "Top rated",
  "catalog.topRated.description":
    "Best Amazon ratings, from at least {min} reviews",
  "catalog.row.seeAll": "See all",
  "catalog.row.seeAllLabel": "See all {title}",
  "catalog.row.previous": "Previous products in {title}",
  "catalog.row.next": "Next products in {title}",
  "catalog.row.emptyHere":
    "No products here right now. New deals come in every night.",
  "catalog.allProducts": "All products",
  "catalog.categoryCount": "{count}, biggest discounts first",
  "catalog.results.title": "Search results",
  "catalog.results.count.one": "{count} result for {query}",
  "catalog.results.count.other": "{count} results for {query}",
  "catalog.results.label": "Results for {query}",
  "catalog.noMatch.title": "No products match {query}",
  "catalog.noMatch.body":
    "Check the spelling, try fewer words, or clear the search to browse the lists.",
  "catalog.pastEnd.title": "This page is past the last one",
  "catalog.pastEnd.cta": "Go to the first page",
  "catalog.unknownCategory.title": "We could not find that category",
  "catalog.unknownCategory.body":
    "It may have no deals right now. The lists show every category that does.",
  "catalog.unknownCategory.cta": "Browse all products",
  "catalog.empty.title": "No products yet",
  "catalog.empty.body":
    "Products appear here after the nightly import of Amazon deals runs. Check back after it has run once.",

  // Amazon deal categories (src/features/products/categories.ts)
  "category.deals-all": "More deals",
  "category.automotive": "Automotive",
  "category.baby": "Baby",
  "category.beauty": "Beauty",
  "category.books": "Books",
  "category.computers": "Computers",
  "category.coupons": "Coupons",
  "category.eBooks": "eBooks",
  "category.electronics": "Electronics",
  "category.eletro": "Appliances",
  "category.fashion": "Fashion",
  "category.grocery": "Grocery",
  "category.health-and-personal-care": "Health and personal care",
  "category.home": "Home",
  "category.kitchen": "Kitchen",
  "category.lawn-and-garden": "Garden",
  "category.moveis": "Furniture",
  "category.office-products": "Office",
  "category.pet-products": "Pet products",
  "category.sports": "Sports",
  "category.tools": "Tools",
  "category.toys-and-games": "Toys and games",
  "category.tvs": "TVs",
  "category.video-games": "Video games",

  // Pagination (catalog grids and review pages)
  "pagination.label": "Pagination",
  "pagination.previous": "Previous page",
  "pagination.next": "Next page",
  "pagination.page": "Page {page}",

  // Product card (specs/product.md): the app's reviews first, Amazon's second
  "products.count.one": "{count} product",
  "products.count.other": "{count} products",
  "products.card.discount": "{percent}% off",
  "products.card.was": "Was",
  "products.card.reviewsHere.one": "{count} review here",
  "products.card.reviewsHere.other": "{count} reviews here",
  "products.card.noReviews": "No reviews yet",
  "products.card.seeReviews.one": "See {count} review",
  "products.card.seeReviews.other": "See {count} reviews",

  // Feedback form and its states (specs/feedback.md)
  "feedback.form.title": "Write feedback",
  "feedback.form.leadBefore":
    "Tell other buyers how the product held up. It is posted as",
  "feedback.form.rating": "Rating",
  "feedback.form.comment": "Comment",
  "feedback.form.placeholder":
    "What did you like, and what would you warn others about?",
  "feedback.form.characters": "{count} of {max} characters",
  "feedback.form.cancel": "Cancel",
  "feedback.form.submit": "Post feedback",
  "feedback.form.pending": "Posting feedback...",
  "feedback.form.posted": "Feedback posted",
  "feedback.form.seeYourReviews": "See your reviews",
  "feedback.form.previewEmpty": "Your comment appears here as you type.",
  "feedback.already.stampLine1": "Already",
  "feedback.already.stampLine2": "reviewed",
  "feedback.already.title": "You already reviewed this product",
  "feedback.already.body":
    "Each product takes one review per person. Yours is on your page.",
  "feedback.already.back": "Back to the catalog",
  "feedback.already.seeYourReviews": "See your reviews",
  "feedback.notFound.slipProduct": "No product here",
  "feedback.notFound.slipAuthor": "nobody yet",
  "feedback.notFound.title": "Product not found",
  "feedback.notFound.body":
    "This link does not match a product in the catalog. Search the catalog to find the one you want to review.",
  "feedback.notFound.cta": "Go to the catalog",
  "feedback.postedAgo": "Posted {ago}",
  "feedback.postedJustNow": "Posted just now",

  // My page (/me, specs/home.md)
  "me.greeting": "Welcome back, {name}",
  "me.memberSince": "Member since {date}",
  "me.lead":
    "Bought something worth talking about? Find it in the catalog and write it up while you still remember the details.",
  "me.writeFeedback": "Write feedback",
  "me.recentTitle": "Your recent feedback",
  "me.accountTitle": "Your account",
  "me.loading": "Loading your page",
  "me.loadingRecent": "Loading your recent feedback",
  "me.slipProduct": "Something you bought recently",
  "me.field.name": "Name",
  "me.field.email": "Email",
  "me.field.membership": "Membership",
  "me.recent.loadFailed":
    "Could not load your feedback. Refresh the page to try again.",
  "me.recent.emptyTitle": "No feedback yet",
  "me.recent.emptyBody":
    "Pick a product from the catalog and your reviews show up here, newest first.",
  "me.recent.emptyCta": "Find a product to review",
  "me.language.label": "Language",
  "me.language.hint": "Used on every page and for the AI summaries.",
  "me.language.saving": "Saving...",

  // Product reviews page (specs/product-reviews.md)
  "reviews.seeFeedback": "See feedback",
  "reviews.seeAllReviews": "See all reviews",
  "reviews.ofProduct": "of {title}",
  "reviews.amazonRating": "{rating} on Amazon ({count})",
  "reviews.amazonRatingNoCount": "{rating} on Amazon",
  "reviews.giveFeedback": "Give feedback",
  "reviews.alreadyReviewed": "You reviewed this product",
  "reviews.loading": "Loading the product",
  "reviews.count.one": "{count} review",
  "reviews.count.other": "{count} reviews",
  "reviews.stars.one": "{count} star",
  "reviews.stars.other": "{count} stars",
  "reviews.stats.title": "Community rating",
  "reviews.stats.outOf": "out of 5",
  "reviews.stats.averageLabel": "Average rating {average} out of 5",
  "reviews.stats.noAverage": "No ratings yet",
  "reviews.stats.distribution": "Ratings by stars",
  "reviews.list.title": "Community reviews",
  "reviews.list.reviewBy": "Review by",
  "reviews.list.formerMember": "a former member",
  "reviews.list.loadFailed":
    "Could not load the reviews. Refresh the page to try again.",
  "reviews.empty.title": "No reviews yet",
  "reviews.empty.body":
    "Used this product? Your review is the first thing the next buyer reads.",
  "reviews.empty.cta": "Be the first to review",
  "reviews.pastEnd.body": "There are no reviews on this page.",
  "reviews.pastEnd.cta": "Go to the newest reviews",
  "reviews.summary.label": "AI summary",
  "reviews.summary.verdict.positive": "Mostly positive",
  "reviews.summary.verdict.mixed": "Mixed opinions",
  "reviews.summary.verdict.negative": "Mostly negative",
  "reviews.summary.pros": "What people like",
  "reviews.summary.cons": "What people dislike",
  "reviews.summary.footer.one": "AI summary of {count} review, updated {date}",
  "reviews.summary.footer.other":
    "AI summary of {count} reviews, updated {date}",
  "reviews.summary.tooFew": "The summary appears after 3 reviews",
  "reviews.summary.tooFewBody":
    "Once three people review this product, an AI summary of what they think shows up here.",
  "reviews.summary.unavailable": "Summary unavailable right now",
  "reviews.summary.unavailableBody":
    "The reviews below are all here. The summary will be back on a later visit.",
  "reviews.summary.loading": "Writing the AI summary",

  // Study-project disclaimer (specs/home.md): full notice on /, short footer elsewhere
  "disclaimer.title": "A study project",
  "disclaimer.body":
    "Product Review System is a non-profit study and portfolio project. Personal data you enter is used only to run this demo and is never shared, sold or used for anything else. You will never receive emails from it. Depending on when you visit, some features (such as product imports or AI summaries) may be turned off to keep it free to run — open an issue on GitHub and they will be re-enabled for testing.",
  "disclaimer.footer":
    "Study project, non-profit. Your data is not used for anything else and you will never get emails. Some features may be off at times — ask on GitHub to re-enable them.",
  "disclaimer.contact": "Contact on GitHub",
  "disclaimer.opensNewTab": "(opens in a new tab)",

  // 404 (src/app/[lang]/not-found.tsx): any URL without a page
  "notFound.title": "Page not found",
  "notFound.body":
    "This link does not lead to a page here. It may have moved, or the address has a typo.",
  "notFound.cta": "Go to the catalog",
  "notFound.slipProduct": "Nothing at this address",
  "notFound.slipAuthor": "nobody yet",
} as const satisfies Record<string, string>;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
