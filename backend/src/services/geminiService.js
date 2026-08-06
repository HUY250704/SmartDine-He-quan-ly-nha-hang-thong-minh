import { withRetry } from "../utils/retry.js";

// ─── Cấu hình (đọc lazy để dotenv kịp load) ─────────────────
function parseKeys(envVar) {
  if (!envVar) return [];
  return envVar
    .split(",")
    .map((k) => k.trim())
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
  const raw = process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  _modelsCache = raw.split(",").map((m) => m.trim()).filter(Boolean);
  return _modelsCache;
}

function getDefaultModel() {
  const models = getModels();
  return models[0] || "gemini-2.5-flash";
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
    const msg = (error?.message || "").toLowerCase();
    const isQuota =
      msg.includes("quota") ||
      msg.includes("rate") ||
      msg.includes("resource_exhausted") ||
      msg.includes("429") ||
      msg.includes("503") ||
      msg.includes("overloaded") ||
      msg.includes("unavailable");

    if (isQuota) {
      this.cooldowns.set(key, Date.now() + this.cooldownMs);
      console.warn(
        `[geminiService] Key ${key.slice(0, 8)}... bị quota → cooldown ${this.cooldownMs / 1000}s`
      );
    }
  }

  /** Reset cooldown của một key */
  clearCooldown(key) {
    this.cooldowns.delete(key);
  }
}

let _keyRing = null;

function getKeyRing() {
  if (!_keyRing) {
    _keyRing = new KeyRing(getAllKeys());
  }
  return _keyRing;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Gửi prompt đến Gemini, tự động xoay key & model khi gặp lỗi quota.
 *
 * @param {string} prompt      - nội dung prompt
 * @param {object} [options]
 * @param {string} [options.model]   - model cụ thể (mặc định getDefaultModel())
 * @param {number} [options.maxKeySwitches] - số lần đổi key tối đa (mặc định: số key)
 */
export async function generateContent(prompt, options = {}) {
  if (getAllKeys().length === 0) {
    throw new Error("Không có GEMINI_API_KEY nào được cấu hình.");
  }

  const maxSwitches = options.maxKeySwitches ?? getAllKeys().length;
  let switches = 0;
  const triedModels = new Set();

  while (switches <= maxSwitches) {
    const apiKey = getKeyRing().getNext();
    if (!apiKey) throw new Error("Không có API key khả dụng.");

    // Chọn model: ưu tiên model chỉ định, sau đó luân phiên các model trong danh sách
    const modelAttempt = chooseModel(options.model, triedModels);

    try {
      const result = await withRetry(async () => {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const genModel = genAI.getGenerativeModel({ model: modelAttempt });
        const res = await genModel.generateContent(prompt);
        return res.response.text().trim();
      });

      // Thành công → xóa cooldown của key vừa dùng
      getKeyRing().clearCooldown(apiKey);
      return result;

    } catch (error) {
      const msg = (error?.message || "").toLowerCase();
      const isQuota =
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("resource_exhausted") ||
        msg.includes("429") ||
        msg.includes("503") ||
        msg.includes("overloaded") ||
        msg.includes("unavailable");

      if (isQuota) {
        getKeyRing().markCooldown(apiKey, error);
        switches++;
        console.warn(
          `[geminiService] Chuyển key/model (lần ${switches}/${maxSwitches}): ${error.message}`
        );
        // Nếu đã thử tất cả model ở key hiện tại → reset triedModels để thử lại model khác
        if (triedModels.size >= getModels().length) triedModels.clear();
        continue;
      }

      // Lỗi khác (network, auth, …) — vẫn thử key khác
      switches++;
      if (switches > maxSwitches) throw error;
      if (triedModels.size >= getModels().length) triedModels.clear();
    }
  }

  throw new Error("Đã thử tất cả API key & model nhưng vẫn thất bại.");
}

function chooseModel(preferred, triedModels) {
  const candidate = preferred || getDefaultModel();
  if (!triedModels.has(candidate)) {
    triedModels.add(candidate);
    return candidate;
  }
  // Fallback qua các model khác
  for (const m of getModels()) {
    if (!triedModels.has(m)) {
      triedModels.add(m);
      return m;
    }
  }
  // Tất cả model đã thử → reset và thử lại
  triedModels.clear();
  triedModels.add(getModels()[0]);
  return getModels()[0];
}

/** Trả về số key đang khả dụng (không bị cooldown) */
export function availableKeyCount() {
  const now = Date.now();
  return getAllKeys().filter((k) => {
    const until = getKeyRing().cooldowns.get(k);
    return !until || now >= until;
  }).length;
}
