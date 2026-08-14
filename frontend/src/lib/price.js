// Centralized VND price formatting.
// Supports both modern VND values and legacy USD seed values.
const LEGACY_USD_TO_VND = 25000;

export function normalizeVND(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const abs = Math.abs(n);

  // Legacy seed prices were USD amounts such as 12, 16, 58.
  if (abs > 0 && abs < 1000) {
    return Math.round(n * LEGACY_USD_TO_VND);
  }

  return Math.round(n);
}
export function toVND(price) {
  if (price == null) return 0;
  return normalizeVND(price);
}

export function formatVND(price) {
  return toVND(price).toLocaleString("vi-VN") + "\u0111";
}

export function formatPrice(price) {
  if (price == null) return "0\u0111";
  return normalizeVND(price).toLocaleString("vi-VN") + "\u0111";
}
