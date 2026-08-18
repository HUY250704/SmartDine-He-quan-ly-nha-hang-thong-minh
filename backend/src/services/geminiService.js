import { withRetry } from "../utils/retry.js";

// ─── Cấu hình (đọc lazy để dotenv kịp load) ─────────────────
const DEFAULT_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

function parseKeys(envVar) {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function parseModels(envVar) {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

let _keysCache = null;
let _modelsCache = null;
let _warned = false;

function getAllKeys() {
  if (_keysCache) return _keysCache;
  const primary = parseKeys(process.env.GEMINI_API_KEYS);
  const fallback = parseKeys(process.env.GEMINI_API_KEY)
    .concat(parseKeys(process.env.GEMINI_FALLBACK_API_KEYS));
  _keysCache = [...primary, ...fallback];
  if (_keysCache.length === 0 && !_warned) {
    _warned = true;
    console.warn("[geminiService] Không có GEMINI_API_KEY nào được cấu hình.");
  }
  return _keysCache;
}

function getModels() {
  if (_modelsCache) return _modelsCache;

  const explicitModels = parseModels(process.env.GEMINI_MODELS);
  if (explicitModels.length > 0) {
    _modelsCache = explicitModels;
    return _modelsCache;
  }

  const preferred = parseModels(process.env.GEMINI_MODEL);
  _modelsCache = [...new Set([...preferred, ...DEFAULT_MODELS])];
  return _modelsCache;
}

function _orderedModels(preferred, allModels) {
  const ordered = [];
  const addModel = (model) => {
    if (model && !ordered.includes(model)) ordered.push(model);
  };

  addModel(preferred);
  for (const model of allModels) addModel(model);
  return ordered;
}

/** Chọn model đầu tiên chưa thử trong thứ tự ưu tiên. */
function _pickUntried(preferred, triedSet, allModels) {
  const ordered = _orderedModels(preferred, allModels);
  return ordered.find((model) => !triedSet.has(model)) || null;
}

/** Nhận diện lỗi quota/rate-limit chung cho Gemini. */
function _isQuotaError(error) {
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

// ─── Trạng thái xoay vòng ───────────────────────────────────
class KeyRing {
  constructor(keys) {
    this.keys = keys;            // mảng key
    this.index = 0;             // vị trí key hiện tại
    this.cooldowns = new Map(); // key → timestamp hết hạn cooldown
    this.cooldownMs = 30_000;   // 30 giây cooldown khi key bị quota exceeded
  }

  /** Lấy key kế tiếp khả dụng (bỏ qua key đang cooldown) */
  getNext() {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    const start = this.index;

    for (let i = 0; i < this.keys.length; i++) {
      const idx = (start + i) % this.keys.length;
      const key = this.keys[idx];
      const until = this.cooldowns.get(key);
      if (until && now < until) continue; // key đang cooldown → bỏ qua
      this.index = (idx + 1) % this.keys.length;
      return key;
    }

    // Tất cả key đều đang cooldown → trả key có cooldown sớm nhất hết hạn
    const best = [...this.cooldowns.entries()].sort((a, b) => a[1] - b[1])[0];
    if (best) {
      const waitMs = Math.max(0, best[1] - now);
      throw new Error(
        `Tất cả API key đang bị giới hạn quota. Thử lại sau ${Math.ceil(waitMs / 1000)}s.`
      );
    }

    return this.keys[0];
  }

  /** Đánh dấu key vào cooldown nếu lỗi quota */
  markCooldown(key, error) {
    if (!_isQuotaError(error)) return;

    this.cooldowns.set(key, Date.now() + this.cooldownMs);
    console.warn(
      `[geminiService] Key ${key.slice(0, 8)}... bị quota → cooldown ${this.cooldownMs / 1000}s`
    );
  }

  /** Reset cooldown của một key */
  clearCooldown(key) {
    this.cooldowns.delete(key);
  }
}

class ModelRing {
  constructor(models) {
    this.models = models;
    this.cooldowns = new Map(); // model → timestamp hết hạn cooldown
    this.cooldownMs = 60_000;   // 60 giây cooldown khi model bị quota exceeded
  }

  isOnCooldown(model) {
    const until = this.cooldowns.get(model);
    return Boolean(until && Date.now() < until);
  }

  /**
   * Lấy model kế tiếp chưa thử và không nằm trong cooldown.
   * Những model đang cooldown sẽ được đưa vào triedSet để tránh thử lại.
   */
  getNext(preferred, triedSet = new Set()) {
    let model = _pickUntried(preferred, triedSet, this.models);

    while (model && this.isOnCooldown(model)) {
      triedSet.add(model);
      model = _pickUntried(preferred, triedSet, this.models);
    }

    return model;
  }

  /** Đánh dấu model vào cooldown nếu lỗi quota */
  markCooldown(model, error) {
    if (!_isQuotaError(error)) return;

    this.cooldowns.set(model, Date.now() + this.cooldownMs);
    console.warn(
      `[geminiService] Model ${model} bị quota → cooldown ${this.cooldownMs / 1000}s`
    );
  }

  /** Reset cooldown của một model */
  clearCooldown(model) {
    this.cooldowns.delete(model);
  }

  allOnCooldown() {
    return (
      this.models.length > 0 &&
      this.models.every((model) => this.isOnCooldown(model))
    );
  }
}

let _keyRing = null;
let _modelRing = null;

function getKeyRing() {
  if (!_keyRing) {
    _keyRing = new KeyRing(getAllKeys());
  }
  return _keyRing;
}

function getModelRing() {
  if (!_modelRing) {
    _modelRing = new ModelRing(getModels());
  }
  return _modelRing;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Gửi prompt đến Gemini, tự động xoay model trên từng key.
 *
 * Với mỗi key, thử lần lượt các model chưa dùng cho key đó.
 * Khi một model báo quota, model đó vào cooldown và thử model kế tiếp.
 * Khi hết model cho key hiện tại, key đó vào cooldown và chuyển key kế tiếp.
 *
 * @param {string} prompt      - nội dung prompt
 * @param {object} [options]
 * @param {string} [options.model]   - model ưu tiên (mặc định theo GEMINI_MODELS)
 * @param {number} [options.maxKeySwitches] - số key tối đa được thử (mặc định: số key)
 */
export async function generateContent(prompt, options = {}) {
  if (getAllKeys().length === 0) {
    throw new Error("Không có GEMINI_API_KEY nào được cấu hình.");
  }

  const models = getModels();
  const modelCandidates = _orderedModels(options.model, models);
  const maxSwitches = options.maxKeySwitches ?? getAllKeys().length;
  let switches = 0;

  while (switches < maxSwitches) {
    const apiKey = getKeyRing().getNext();
    if (!apiKey) throw new Error("Không có API key khả dụng.");

    const triedModels = new Set();
    let exhaustedModelsOnKey = false;

    while (!exhaustedModelsOnKey) {
      const model = getModelRing().getNext(options.model, triedModels);
      if (!model) {
        exhaustedModelsOnKey = true;
        break;
      }

      console.log(`[geminiService] Thử key=${apiKey.slice(0, 8)}... model=${model}`);
      triedModels.add(model);

      try {
        const result = await withRetry(async () => {
          const { GoogleGenerativeAI } = await import("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(apiKey);
          const genModel = genAI.getGenerativeModel({ model });
          const res = await genModel.generateContent(prompt);
          return res.response.text().trim();
        });

        // Thành công → xóa cooldown của cả key lẫn model vừa dùng
        getKeyRing().clearCooldown(apiKey);
        getModelRing().clearCooldown(model);
        return result;
      } catch (error) {
        if (_isQuotaError(error)) {
          getModelRing().markCooldown(model, error);

          const allModelsTried = triedModels.size >= modelCandidates.length;
          if (allModelsTried || getModelRing().allOnCooldown()) {
            getKeyRing().markCooldown(apiKey, error);
            exhaustedModelsOnKey = true;
          }

          console.warn(
            `[geminiService] Quota ở model ${model}. Đã thử ${triedModels.size}/${modelCandidates.length} model cho key ${apiKey.slice(0, 8)}...`
          );
          continue;
        }

        // Lỗi auth/network không phải quota → không fallback model/key vô nghĩa.
        throw error;
      }
    }

    switches++;
  }

  throw new Error("Đã thử tất cả API key & model nhưng vẫn thất bại.");
}

/** Trả về số key đang khả dụng (không bị cooldown) */
export function availableKeyCount() {
  const now = Date.now();
  return getAllKeys().filter((key) => {
    const until = getKeyRing().cooldowns.get(key);
    return !until || now >= until;
  }).length;
}

/** Trả về số model đang khả dụng (không bị cooldown) */
export function availableModelCount() {
  return getModelRing().models.filter((model) => !getModelRing().isOnCooldown(model)).length;
}

/** Trạng thái key/model phục vụ debug và monitor */
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
