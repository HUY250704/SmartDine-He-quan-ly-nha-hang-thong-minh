import OrderItem from '../models/OrderItem.js';

/**
 * Fetch all OrderItems for an array of orders in a single query,
 * then group by orderId in memory. Eliminates N+1 pattern.
 *
 * @param {Array<ObjectId|string>} orderIds
 * @param {string} [menuPopulate='name price'] - fields to populate on menuItemId
 * @returns {Map<string, Array>} Map of orderId → items[]
 */
export async function batchOrderItems(orderIds, menuPopulate = 'name price') {
  if (!orderIds.length) return new Map();

  const allItems = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('menuItemId', menuPopulate);

  const map = new Map();
  for (const item of allItems) {
    const oid = item.orderId.toString();
    if (!map.has(oid)) map.set(oid, []);
    map.get(oid).push(item);
  }
  return map;
}