# Sign-In (Authentication)

## Scope
Frontend, backend, database

## Context
Accounts can already be created (`specs/sign-up.md`). Implement the flow that lets an existing account sign in, keeps the person signed in with a server-side session, and lets them sign out.
Required data:
- Email
- Password

The session created here is what `specs/home.md` and `specs/feedback.md` use to identify the current user.

## Functional requirements
1. Add form validation on client side
    1. In case of a valid form send request to the API
2. Validate the credentials against the 'accounts' table
    1. Email is normalized the same way as on sign-up (trimmed, lowercased)
    2. Password is compared with the stored bcrypt hash
    3. Inactive accounts (`active = false`) cannot sign in
    4. Wrong email, wrong password and inactive account return the same generic error ("Invalid email or password"), so the API does not reveal which emails are registered
    5. When the email does not exist, still run a bcrypt comparison against a dummy hash, so response time does not reveal it either
3. Create a session in a new database table 'sessions'
    1. id: nanoid (generated in the API)
    2. account_id: text (FK to `accounts.id`, cascade on delete)
    3. token_hash: text (Unique). SHA-256 of the session token, never the token itself
    4. created_at: timestamp
    5. expires_at: timestamp (created_at + 7 days)
4. Send the session token to the browser in a cookie `prs_session`
    1. `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` = 7 days
    2. `Secure` in production
5. Request must be a POST to 'api/v1/sign-in' and receive the data as a JSON body
6. Sign-out: POST to 'api/v1/sign-out' (and tRPC `auth.signOut`) deletes the session row and clears the cookie. It is idempotent: signing out without a session still returns success
7. HTTP codes (sign-in)
    1. 200: Success, body `{ id, firstName, lastName, email }`
    2. 400: Bad data format
    3. 401: Invalid email or password (or inactive account)
    4. 500: Unexpected server error
8. Session reading (used by the other features)
    1. A request is authenticated when its cookie matches a session that is not expired and belongs to an active account
    2. Expired sessions are treated as no session
9. Security
    1. Never store or log the plain password or the plain session token
    2. Must use HTTPS to receive client data (already enforced by Vercel + HSTS)

## Non-Functional requirements
- UI/UX
    - Same visual identity as sign-up (split layout, review slip panel)
    - Error from the API shown in the form and as a toast
- Performance
    - One database round trip to validate credentials and one to create the session

## Must do
- Create the sign-in endpoint (tRPC `auth.signIn` + REST `POST /api/v1/sign-in`)
- Create the sign-out endpoint (tRPC `auth.signOut` + REST `POST /api/v1/sign-out`)
- Create the `sessions` table migration
- Implement the session helpers defined in the shared contract (`plans/01-sign-in-home-feedback/execution.md`)
- Create the `/auth/sign-in` page
- Link sign-in and sign-up pages to each other, add "Sign in" to the landing page, and point the sign-up success page to sign-in
- Test and validations

## Must not do
- Password reset, "remember me", OAuth/social login, email verification
- Rate limiting or account lockout (future spec)
- Build the `/home` page (`specs/home.md`)
- Use Supabase Auth (accounts live in our own table)

## Technologies (Stack)
- React.js
- Next.js
- React-Hook-Form
- shadcn
- Tailwind
- Supabase
- tRPC
- bcryptjs, node:crypto

## Acceptance criteria
- A new page to sign in exists in '/auth/sign-in'
- The page has the main validation form (email, password)
- The page connects with the API and receives a valid answer
- Wrong credentials show "Invalid email or password" in the form and as a toast
- In case of success the `prs_session` cookie is set and the user is redirected to '/home'
- Visiting '/auth/sign-in' while signed in redirects to '/home'
- Sign-out removes the session from the database and clears the cookie

## Results
Users with an account can sign in, stay signed in for 7 days, and sign out.
