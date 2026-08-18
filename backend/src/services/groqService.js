import { withRetry } from "../utils/retry.js";

const DEFAULT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

function parseList(envVar) {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

let _keysCache = null;
let _modelsCache = null;
let _warned = false;

function getAllKeys() {
  if (_keysCache) return _keysCache;

  const primary = parseList(process.env.GROQ_API_KEYS);
  const fallback = parseList(process.env.GROQ_API_KEY)
    .concat(parseList(process.env.GROQ_FALLBACK_API_KEYS));
  _keysCache = [...primary, ...fallback];

  if (_keysCache.length === 0 && !_warned) {
    _warned = true;
    console.warn("[groqService] No GROQ_API_KEY configured.");
  }

  return _keysCache;
}

function getModels() {
  if (_modelsCache) return _modelsCache;

  const explicitModels = parseList(process.env.GROQ_MODELS);
  if (explicitModels.length > 0) {
    _modelsCache = explicitModels;
    return _modelsCache;
  }

  const preferred = parseList(process.env.GROQ_MODEL);
  _modelsCache = [...new Set([...preferred, ...DEFAULT_MODELS])];
  return _modelsCache;
}

function orderedModels(preferred, allModels) {
  const ordered = [];
  const add = (model) => {
    if (model && !ordered.includes(model)) ordered.push(model);
  };

  add(preferred);
  for (const model of allModels) add(model);
  return ordered;
}

function pickUntried(preferred, triedSet, allModels) {
  const ordered = orderedModels(preferred, allModels);
  return ordered.find((model) => !triedSet.has(model)) || null;
}

function isQuotaError(error) {
  const msg = String(error?.message || error?.status || "").toLowerCase();
  return (
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

class KeyRing {
  constructor(keys) {
    this.keys = keys;
    this.index = 0;
    this.cooldowns = new Map();
    this.cooldownMs = 30_000;
  }

  getNext() {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const start = this.index;

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (start + i) % this.keys.length;
      const key = this.keys[idx];
      const until = this.cooldowns.get(key);
      if (until && now < until) continue;

      this.index = (idx + 1) % this.keys.length;
      return key;
    }

    const best = [...this.cooldowns.entries()].sort((a, b) => a[1] - b[1])[0];
    if (best) {
      const waitMs = Math.max(0, best[1] - now);
      throw new Error(`All Groq API keys are cooling down. Retry in ${Math.ceil(waitMs / 1000)}s.`);
    }

    return this.keys[0];
  }

  markCooldown(key, error) {
    if (!isQuotaError(error)) return;

    this.cooldowns.set(key, Date.now() + this.cooldownMs);
    console.warn(`[groqService] Key ${key.slice(0, 8)}... quota -> cooldown ${this.cooldownMs / 1000}s`);
  }

  clearCooldown(key) {
    this.cooldowns.delete(key);
  }
}

class ModelRing {
  constructor(models) {
    this.models = models;
    this.cooldowns = new Map();
    this.cooldownMs = 60_000;
  }

  isOnCooldown(model) {
    const until = this.cooldowns.get(model);
    return Boolean(until && Date.now() < until);
  }

  getNext(preferred, triedSet = new Set()) {
    let model = pickUntried(preferred, triedSet, this.models);

    while (model && this.isOnCooldown(model)) {
      triedSet.add(model);
      model = pickUntried(preferred, triedSet, this.models);
    }

    return model;
  }

  markCooldown(model, error) {
    if (!isQuotaError(error)) return;

    this.cooldowns.set(model, Date.now() + this.cooldownMs);
    console.warn(`[groqService] Model ${model} quota -> cooldown ${this.cooldownMs / 1000}s`);
  }

  clearCooldown(model) {
    this.cooldowns.delete(model);
  }

  allOnCooldown() {
    return this.models.length > 0 && this.models.every((model) => this.isOnCooldown(model));
  }
}

let _keyRing = null;
let _modelRing = null;

function getKeyRing() {
  if (!_keyRing) _keyRing = new KeyRing(getAllKeys());
  return _keyRing;
}

function getModelRing() {
  if (!_modelRing) _modelRing = new ModelRing(getModels());
  return _modelRing;
}

async function callGroqChat(apiKey, model, prompt) {
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const error = new Error(`Groq API error (${response.status}): ${errorText}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq API returned no content.");

  return text;
}

/**
 * Send a prompt to Groq, rotating keys and models when quota errors occur.
 */
export async function generateContent(prompt, options = {}) {
  if (getAllKeys().length === 0) {
    throw new Error("No GROQ_API_KEY configured.");
  }

  const models = getModels();
  const modelCandidates = orderedModels(options.model, models);
  const maxSwitches = options.maxKeySwitches ?? getAllKeys().length;
  let switches = 0;

  while (switches < maxSwitches) {
    const apiKey = getKeyRing().getNext();
    if (!apiKey) throw new Error("No Groq API key available.");

    const triedModels = new Set();
    let exhaustedModelsOnKey = false;

    while (!exhaustedModelsOnKey) {
      const model = getModelRing().getNext(options.model, triedModels);
      if (!model) {
        exhaustedModelsOnKey = true;
        break;
      }

      console.log(`[groqService] Trying key=${apiKey.slice(0, 8)}... model=${model}`);
      triedModels.add(model);

      try {
        const result = await withRetry(() => callGroqChat(apiKey, model, prompt));
        getKeyRing().clearCooldown(apiKey);
        getModelRing().clearCooldown(model);
        return result;
      } catch (error) {
        if (isQuotaError(error)) {
          getModelRing().markCooldown(model, error);

          const allModelsTried = triedModels.size >= modelCandidates.length;
          if (allModelsTried || getModelRing().allOnCooldown()) {
            getKeyRing().markCooldown(apiKey, error);
            exhaustedModelsOnKey = true;
          }

          console.warn(
            `[groqService] Quota on model ${model}. Tried ${triedModels.size}/${modelCandidates.length} models for key ${apiKey.slice(0, 8)}...`
          );
          continue;
        }

        throw error;
      }
    }

    switches++;
  }

  throw new Error("All Groq API keys and models failed.");
}

export function availableKeyCount() {
  const now = Date.now();
  return getAllKeys().filter((key) => {
    const until = getKeyRing().cooldowns.get(key);
    return !until || now >= until;
  }).length;
}

export function availableModelCount() {
  return getModelRing().models.filter((model) => !getModelRing().isOnCooldown(model)).length;
}

export function getServiceStatus() {
  const now = Date.now();

  const keys = getAllKeys().map((key) => {
    const until = getKeyRing().cooldowns.get(key);
    return {
      key: `${key.slice(0, 8)}...${key.slice(-4)}`,
      onCooldown: Boolean(until && now < until),
      cooldownRemainingMs: until && now < until ? until - now : 0,
    };
  });

  const models = getModelRing().models.map((model) => {
    const until = getModelRing().cooldowns.get(model);
    return {
      model,
      onCooldown: Boolean(until && now < until),
      cooldownRemainingMs: until && now < until ? until - now : 0,
    };
  });

  return {
    keys: {
      total: keys.length,
      available: availableKeyCount(),
      items: keys,
    },
    models: {
      total: models.length,
      available: availableModelCount(),
      items: models,
    },
  };
}
