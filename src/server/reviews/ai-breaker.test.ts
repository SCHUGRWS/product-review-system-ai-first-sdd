import { describe, expect, it } from "vitest";
import { aiDisabledHours, aiOutageReason } from "./ai-breaker";

// The shape @mastra/core 1.73 throws from agent.generate: the AI SDK's
// APICallError, unwrapped (checked against a local fake OpenAI server).
function apiCallError(
  statusCode: number,
  error: { message: string; type: string | null; code: string | null },
) {
  return Object.assign(new Error(error.message), {
    name: "AI_APICallError",
    statusCode,
    responseBody: JSON.stringify({ error: { ...error, param: null } }),
    data: { error: { ...error, param: null } },
    isRetryable: statusCode === 429 || statusCode >= 500,
  });
}

const quota = apiCallError(429, {
  message: "You exceeded your current quota",
  type: "insufficient_quota",
  code: "insufficient_quota",
});
const billing = apiCallError(400, {
  message: "Billing hard limit has been reached",
  type: "invalid_request_error",
  code: "billing_hard_limit_reached",
});
const badKey = apiCallError(401, {
  message: "Incorrect API key provided",
  type: "invalid_request_error",
  code: "invalid_api_key",
});
const rateLimit = apiCallError(429, {
  message: "Rate limit reached for requests",
  type: "requests",
  code: "rate_limit_exceeded",
});
const serverError = apiCallError(500, {
  message: "The server had an error",
  type: "server_error",
  code: null,
});

describe("aiOutageReason", () => {
  it("trips on quota, billing and invalid-key errors", () => {
    expect(aiOutageReason(quota)).toBe("insufficient_quota");
    expect(aiOutageReason(billing)).toBe("billing_hard_limit_reached");
    expect(
      aiOutageReason(
        apiCallError(429, {
          message: "Billing hard limit has been reached",
          type: "insufficient_quota",
          code: "billing_hard_limit_reached",
        }),
      ),
    ).toBe("billing_hard_limit_reached");
    expect(aiOutageReason(badKey)).toBe("invalid_api_key");
  });

  it("trips when the OpenAI project does not allow the model", () => {
    // Real response seen on 2026-10-18 with a project restricted to other models
    const notAllowed = apiCallError(403, {
      message: "Project `proj_x` does not have access to model `gpt-4.1-nano`",
      type: "invalid_request_error",
      code: "model_not_found",
    });
    expect(aiOutageReason(notAllowed)).toBe("model_not_found");
    // Any other 403 is not a known settings problem
    expect(
      aiOutageReason(
        apiCallError(403, { message: "Forbidden", type: null, code: null }),
      ),
    ).toBeNull();
  });

  it("finds the cause inside wrapper errors", () => {
    const retry = Object.assign(new Error("Failed after 3 attempts"), {
      name: "AI_RetryError",
      errors: [quota, quota, quota],
      lastError: quota,
    });
    expect(aiOutageReason(retry)).toBe("insufficient_quota");
    expect(aiOutageReason(new Error("wrapped", { cause: badKey }))).toBe(
      "invalid_api_key",
    );
  });

  it("does not trip on timeouts, rate limits, 5xx or unknown errors", () => {
    expect(aiOutageReason(rateLimit)).toBeNull();
    expect(aiOutageReason(serverError)).toBeNull();
    expect(aiOutageReason(new Error("The summary model did not answer"))).toBe(
      null,
    );
    expect(aiOutageReason(undefined)).toBeNull();
    expect(aiOutageReason("boom")).toBeNull();
  });
});

describe("aiDisabledHours", () => {
  it("defaults to 6 and reads AI_DISABLED_HOURS", () => {
    expect(aiDisabledHours({})).toBe(6);
    expect(aiDisabledHours({ AI_DISABLED_HOURS: "12" })).toBe(12);
    expect(aiDisabledHours({ AI_DISABLED_HOURS: "0.5" })).toBe(0.5);
    expect(aiDisabledHours({ AI_DISABLED_HOURS: "0" })).toBe(6);
    expect(aiDisabledHours({ AI_DISABLED_HOURS: "soon" })).toBe(6);
  });
});
