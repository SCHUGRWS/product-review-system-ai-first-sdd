# Sign-Up (Account creation)

## Scope
Frontend, backend, database

## Context
Implement flow to allow account creation.
Required data:
- First name
- Last name
- Email
- Password
- Password confirmation

## Functional requirements
1. Add form validation on client side
    1. In case of a valid form send request to the API
2. First and last name must be different fields
3. Add new account to database, table 'accounts'
    1. id: nanoid (generate with 'nanoid' in the API)
    2. first_name: text
    3. last_name: text
    4. created_at: timestamp
    5. active: boolean
    6. email: text (Unique)
    7. password: text (hashed)
    8. salt: text (bcrypt salt)
4. Request must be a POST to 'api/v1/sign-up' and receive the data as a JSON body
5. HTTP codes
    1. 201: Created (body `{ id, email }`)
    2. 400: Bad data format
    3. 409: Email already registered
    4. 500: Unexpected server error
6. Security
    1. Save a safe version of the password in the database
    2. Must use HTTPS to receive client data (to prevent network sniff)

## Non-Functional requirements
- UI/UX
    - Modern and simple interface
- Performance
    - Must be fast and not hold the client waiting


## Must do
- Create an account creation endpoint
- Create an initial project page with the account creation interface
- Config main libraries
- Save account information in the database
- Test and validations

## Must not do
- Implement any other function that is not related with sign-up
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
- A new page to allow account creating exists in '/auth/sign-up'
- The page has the main validation form
- The page must connect with the API to send the data and receive a valid answer
- The errors are correctly logged and propagated
    - Show alert/pop-up in the form if possible
- In case of success redirect to '/auth/sign-up/success'

## Results
Users can create a new account in the platform