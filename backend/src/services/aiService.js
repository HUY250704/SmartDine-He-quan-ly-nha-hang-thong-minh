import OpenAI from 'openai';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Custom error so the controller can distinguish quota / auth / network / config.
 * `expose = true` means the message is safe to return to the client.
 */
class AiServiceError extends Error {
  constructor(code, message, { expose = true, status = 503 } = {}) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.expose = expose;
    this.status = status;
  }
}

function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY;
}

function getGeminiKey() {
  return process.env.GEMINI_API_KEY;
}

function getGeminiModels() {
  return (process.env.GEMINI_MODELS || 'gemini-2.0-flash,gemini-2.5-flash-lite,gemini-2.5-flash')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
}

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
}

/**
 * OpenAI-compatible call against OpenRouter.
 */
async function callOpenRouter(prompt) {
  const key = getOpenRouterKey();
  if (!key) throw new AiServiceError('ai_not_configured', 'OPENROUTER_API_KEY is not set.', { status: 503 });
  const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: key });
  const response = await client.chat.completions.create({
    model: getOpenRouterModel(),
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenRouter.');
  return text.trim();
}

/**
 * Call Google Gemini via the public Generative Language API.
 * Tries each model in GEMINI_MODELS in order until one succeeds.
 */
async function callGemini(prompt) {
  const key = getGeminiKey();
  if (!key) throw new AiServiceError('ai_not_configured', 'GEMINI_API_KEY is not set.', { status: 503 });
  const models = getGeminiModels();
  let lastErr = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });
      if (res.status === 429 || res.status === 503) {
        lastErr = new Error(`Gemini ${model} quota/rate-limit (${res.status})`);
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new AiServiceError('ai_upstream_error', `Gemini ${model} HTTP ${res.status}: ${body.slice(0, 200)}`, { status: 502, expose: false });
      }
      const json = await res.json().catch(() => ({}));
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const text = parts.map(p => p.text || '').join('').trim();
      if (!text) {
        lastErr = new Error(`Gemini ${model} returned empty content.`);
        continue;
      }
      return text;
    } catch (e) {
      if (e instanceof AiServiceError) throw e;
      lastErr = e;
      continue;
    }
  }
  if (lastErr?.message?.includes('quota')) {
    throw new AiServiceError('ai_quota_exceeded', 'All Gemini models are rate-limited. Please retry in ~30s.', { status: 429 });
  }
  throw new AiServiceError('ai_upstream_error', 'All Gemini models failed.', { status: 502, expose: false });
}

/**
 * Send a prompt and get text back from the configured AI provider.
 * Prefers Gemini if GEMINI_API_KEY is set, otherwise OpenRouter.
 * Retries on 429 with exponential backoff.
 */
export async function generateContent(prompt) {
  const useGemini = !!getGeminiKey();
  const useOpenRouter = !!getOpenRouterKey();
  if (!useGemini && !useOpenRouter) {
    throw new AiServiceError('ai_not_configured', 'AI service is not configured (set GEMINI_API_KEY or OPENROUTER_API_KEY).', { status: 503 });
  }

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const text = useGemini ? await callGemini(prompt) : await callOpenRouter(prompt);
      return text;
    } catch (error) {
      lastError = error;
      if (error instanceof AiServiceError) {
        if (error.status === 429 && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`[AI] Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        throw error;
      }
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`[AI] Error (attempt ${attempt}/${maxRetries}): ${error.message}; retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw new AiServiceError('ai_upstream_error', `AI request failed: ${error.message}`, { status: 502, expose: false });
    }
  }

  throw lastError || new AiServiceError('ai_upstream_error', 'AI request failed.', { status: 502, expose: false });
}

/**
 * Returns current AI service status for diagnostics.
 */
export function getServiceStatus() {
  const hasGemini = !!getGeminiKey();
  const hasOpenRouter = !!getOpenRouterKey();
  return {
    provider: hasGemini ? 'gemini' : hasOpenRouter ? 'openrouter' : 'none',
    geminiModels: hasGemini ? getGeminiModels() : null,
    openrouterModel: hasOpenRouter ? getOpenRouterModel() : null,
    configured: hasGemini || hasOpenRouter,
  };
}