// Vitest stand-in for "botid/server": outside a Next.js request there is no
// challenge to read. Tests that need a bot verdict mock this module.
export async function checkBotId() {
  return { isBot: false, isHuman: true, isVerifiedBot: false, bypassed: true };
}
