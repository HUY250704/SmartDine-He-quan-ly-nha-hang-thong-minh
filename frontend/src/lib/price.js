// Centralized VND price formatting. All backend price/amount fields are VND.
export function toVND(price) {
  if (price == null) return 0;
  return Math.round(price);
}

export function formatVND(price) {
  return toVND(price).toLocaleString("vi-VN") + "\u0111";
}

export function formatPrice(price) {
  if (price == null) return "0\u0111";
  return Math.round(price).toLocaleString("vi-VN") + "\u0111";
}
