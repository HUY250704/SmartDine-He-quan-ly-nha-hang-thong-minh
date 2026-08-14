export const LEGACY_USD_TO_VND = 25000;

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

export function calcTotals(subtotal) {
  const tax = Math.round(subtotal * 0.08);
  const serviceCharge = Math.round(subtotal * 0.05);
  const total = Math.round(subtotal + tax + serviceCharge);
  return { subtotal, tax, serviceCharge, total };
}
