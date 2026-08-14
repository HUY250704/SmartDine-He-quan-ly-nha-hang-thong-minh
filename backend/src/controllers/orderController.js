import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Session from '../models/Session.js';
import MenuItem from '../models/MenuItem.js';
import { emitNewOrder, emitOrderUpdated } from '../socket/index.js';
import { batchOrderItems } from '../utils/batchHelpers.js';
import { normalizeVND } from '../utils/price.js';

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort('-createdAt').populate({
      path: 'sessionId',
      select: 'tableId',
      populate: { path: 'tableId', select: 'number' }
    });

    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds);

    const enriched = orders.map(order => {
      const tableNumber = order.sessionId?.tableId?.number || null;
      return { ...order.toObject(), items: itemsMap.get(order._id.toString()) || [], tableNumber };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { sessionId, items } = req.body;
    if (!sessionId || !items || !items.length) {
      return res.status(400).json({ error: 'sessionId and items are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session not found or not active' });
    }

    const order = await Order.create({ sessionId, status: 'PENDING', createdAt: new Date() });

    let orderTotal = 0;
    const orderItems = [];
    for (const item of items) {
      const { menuItemId, quantity, note } = item;
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) return res.status(404).json({ error: 'Menu item ' + menuItemId + ' not found' });

      const orderItem = await OrderItem.create({ orderId: order._id, menuItemId, quantity: quantity || 1, note: note || '', status: 'PENDING' });
      orderItems.push(orderItem);
      orderTotal += normalizeVND(menuItem.price) * (quantity || 1);
    }

    session.totalAmount = normalizeVND(session.totalAmount) + orderTotal;
    await session.save();

    const responseData = { order, items: orderItems, total: orderTotal };
    emitNewOrder(sessionId, session.tableId.toString(), responseData);

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrdersBySession = async (req, res) => {
  try {
    const orders = await Order.find({ sessionId: req.params.id }).sort('-createdAt');
    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds);

    const enriched = orders.map(order => ({
      ...order.toObject(),
      items: itemsMap.get(order._id.toString()) || []
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    await OrderItem.updateMany({ orderId: order._id }, { status });

    const enrichedItems = await OrderItem.find({ orderId: order._id }).populate('menuItemId', 'name price');
    const orderData = { ...order.toObject(), items: enrichedItems };

    emitOrderUpdated(order.sessionId.toString(), orderData);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
