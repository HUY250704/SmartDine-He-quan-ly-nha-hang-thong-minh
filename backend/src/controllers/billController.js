import Bill from '../models/Bill.js';
import Session from '../models/Session.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Table from '../models/Table.js';
import { emitTableUpdated, emitBillCreated } from '../socket/index.js';
import { batchOrderItems } from '../utils/batchHelpers.js';
import { normalizeVND, calcTotals } from '../utils/price.js';

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .sort('-createdAt')
      .populate({
        path: 'sessionId',
        populate: { path: 'tableId', select: 'number' }
      });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate({
        path: 'sessionId',
        populate: { path: 'tableId', select: 'number' }
      });

    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const orders = await Order.find({ sessionId: bill.sessionId._id });
    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds);

    const enrichedOrders = orders.map(order => ({
      ...order.toObject(),
      items: itemsMap.get(order._id.toString()) || []
    }));

    res.json({ bill, orders: enrichedOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateBill = async (req, res) => {
  try {
    const { sessionId, paymentMethod, tableId } = req.body;
    if (!sessionId || !paymentMethod) {
      return res.status(400).json({ error: "sessionId and paymentMethod are required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "ACTIVE") {
      return res.status(400).json({ error: "Session is not active" });
    }

    const existingBill = await Bill.findOne({ sessionId });
    if (existingBill) {
      return res.status(400).json({ error: "Bill already exists for this session" });
    }

    // Get all orders for this session
    const orders = await Order.find({ sessionId, status: { "$ne": "CANCELLED" } });
    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds, "name price image");

    const billItems = [];
    let subtotal = 0;

    for (const order of orders) {
      const items = itemsMap.get(order._id.toString()) || [];
      for (const it of items) {
        const price = normalizeVND(it.menuItemId?.price);
        const qty = it.quantity || 1;
        billItems.push({
          name: it.menuItemId?.name || "Item",
          quantity: qty,
          price: price,
          image: it.menuItemId?.image || ""
        });
        subtotal += price * qty;
      }
    }

    // Merge identical items
    const merged = [];
    billItems.forEach((item) => {
      const existing = merged.find((m) => m.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push(item);
      }
    });

    const { tax, serviceCharge, total } = calcTotals(subtotal);

    const table = await Table.findById(session.tableId);
    const tableNumber = table ? table.number : null;

    let bill;
    try {
      bill = await Bill.create({
        sessionId,
        tableNumber,
        items: merged,
        subtotal,
        tax,
        serviceCharge,
        total,
        paymentMethod,
        paymentStatus: "PAID",
        paidAt: new Date()
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        return res.status(409).json({ error: "Bill already exists for this session (concurrent request)" });
      }
      throw createErr;
    }

    // Close session
    session.status = "CLOSED";
    session.endTime = new Date();
    await session.save();

    // Free table
    await Table.findByIdAndUpdate(session.tableId, {
      status: "CLEANING",
      currentSessionId: null,
    }, { new: true }).then((t) => { if (t) emitTableUpdated(t); });

    // Populate and emit to socket admins
    Bill.findById(bill._id)
      .populate({
        path: "sessionId",
        populate: { path: "tableId", select: "number" }
      })
      .then((popBill) => {
        if (popBill) emitBillCreated(popBill);
      })
      .catch((err) => console.error("Error emitting bill:", err));

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




export const confirmQrPayment = async (req, res) => {
  try {
    const { sessionId, paymentMethod } = req.body;
    if (!sessionId || !['E_WALLET', 'BANK_TRANSFER'].includes(paymentMethod)) return res.status(400).json({ error: 'Invalid QR payment request' });
    const existing = await Bill.findOne({ sessionId });
    if (existing) return res.json(existing);
    const session = await Session.findById(sessionId);
    if (!session || session.status !== 'ACTIVE') return res.status(400).json({ error: 'Session not found or already closed' });
    const orders = await Order.find({ sessionId, status: { $ne: 'CANCELLED' } });
    const map = await batchOrderItems(orders.map(o => o._id), 'name price image');
    const items = []; let subtotal = 0;
    for (const order of orders) for (const item of map.get(order._id.toString()) || []) {
      const quantity = item.quantity || 1; const price = normalizeVND(item.menuItemId?.price); const name = item.menuItemId?.name || 'Item'; subtotal += price * quantity;
      const found = items.find(i => i.name === name); if (found) found.quantity += quantity; else items.push({ name, quantity, price, image: item.menuItemId?.image || '' });
    }
    const { tax, serviceCharge, total } = calcTotals(subtotal); const table = await Table.findById(session.tableId);
    const bill = await Bill.create({ sessionId, tableNumber: table?.number, items, subtotal, tax, serviceCharge, total, paymentMethod, paymentStatus: 'PAID', paidAt: new Date() });
    session.status = 'CLOSED'; session.endTime = new Date(); await session.save();
    await Table.findByIdAndUpdate(session.tableId, { status: 'CLEANING', currentSessionId: null }).then((updated) => { if (updated) emitTableUpdated(updated); });
    const populatedBill = await Bill.findById(bill._id).populate({ path: 'sessionId', populate: { path: 'tableId', select: 'number' } });
    emitBillCreated(populatedBill || bill); return res.status(201).json(bill);
  } catch (error) { if (error.code === 11000) return res.json(await Bill.findOne({ sessionId: req.body.sessionId })); return res.status(500).json({ error: error.message }); }
};
export const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate) match.paidAt = { ...match.paidAt, '$gte': new Date(startDate) };
    if (endDate) match.paidAt = { ...match.paidAt, '$lte': new Date(endDate) };
    if (!startDate && !endDate) {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      match.paidAt = { '$gte': d };
    }

    const result = await Bill.aggregate([
      { '$match': match },
      {
        '$group': {
          _id: null,
          totalRevenue: { '$sum': '$total' },
          count: { '$sum': 1 },
          avgOrder: { '$avg': '$total' }
        }
      }
    ]);

    const paymentBreakdown = await Bill.aggregate([
      { '$match': match },
      {
        '$group': {
          _id: '$paymentMethod',
          total: { '$sum': '$total' },
          count: { '$sum': 1 }
        }
      }
    ]);

    res.json({
      ...(result[0] || { totalRevenue: 0, count: 0, avgOrder: 0 }),
      paymentBreakdown
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
