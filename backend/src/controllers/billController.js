import Bill from '../models/Bill.js';
import Session from '../models/Session.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Table from '../models/Table.js';

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
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ orderId: order._id }).populate('menuItemId', 'name price');
      return { ...order.toObject(), items };
    }));

    res.json({ bill, orders: enrichedOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateBill = async (req, res) => {
  try {
    const { sessionId, paymentMethod } = req.body;
    if (!sessionId || !paymentMethod) {
      return res.status(400).json({ error: 'sessionId and paymentMethod are required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    const existingBill = await Bill.findOne({ sessionId });
    if (existingBill) {
      return res.status(400).json({ error: 'Bill already exists for this session' });
    }

    const bill = await Bill.create({
      sessionId,
      total: session.totalAmount,
      paymentMethod
    });

    session.status = 'CLOSED';
    session.endTime = new Date();
    await session.save();

    await Table.findByIdAndUpdate(session.tableId, {
      status: 'AVAILABLE',
      currentSessionId: null
    });

    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
