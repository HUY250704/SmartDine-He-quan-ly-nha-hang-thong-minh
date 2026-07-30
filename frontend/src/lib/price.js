// Centralized price conversion — seed data stores USD, display as VND
const USD_TO_VND = 25000;

export function toVND(usdPrice) {
  if (usdPrice == null) return 0;
  return Math.round(usdPrice * USD_TO_VND);
}

export function formatVND(usdPrice) {
  return toVND(usdPrice).toLocaleString("vi-VN") + "\u0111";
}

export function formatUSD(usdPrice) {
  return "$" + (usdPrice || 0).toFixed(2);
}
