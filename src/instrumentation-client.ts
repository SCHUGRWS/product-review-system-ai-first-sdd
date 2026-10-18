import { initBotId } from "botid/client/core";

// Vercel BotID (docs/DEPLOY.md): the browser attaches a challenge to these
// requests and the server checks it in auth.signUp. Sign-up runs through tRPC
// from the form and through the REST route; both reach the same procedure.
initBotId({
  protect: [
    { path: "/api/trpc/auth.signUp", method: "POST" },
    { path: "/api/v1/sign-up", method: "POST" },
  ],
});
