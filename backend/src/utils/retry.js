const RETRY_MAX = parseInt(process.env.GEMINI_RETRY_MAX, 10) || 3;
const RETRY_DELAY = parseInt(process.env.GEMINI_RETRY_DELAY_MS, 10) || 1000;
const RETRY_BACKOFF = process.env.GEMINI_RETRY_BACKOFF === "false" ? false : true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? RETRY_MAX;
  const baseDelay = options.baseDelay ?? RETRY_DELAY;
  const backoff = options.backoff ?? RETRY_BACKOFF;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
      const delay = backoff ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
      console.warn(`Retry ${attempt}/${maxRetries - 1} after ${delay}ms: ${error.message}`);
      await sleep(delay);
    }
  }

  throw lastError;
}