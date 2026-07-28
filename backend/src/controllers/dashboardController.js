import Session from '../models/Session.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Table from '../models/Table.js';
import Bill from '../models/Bill.js';

export const overview = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: "OCCUPIED" });
    const activeSessions = await Session.countDocuments({ status: "ACTIVE" });
    const pendingOrders = await Order.countDocuments({ status: { "$in": ["PENDING", "CONFIRMED", "PREPARING"] } });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySessions = await Session.countDocuments({ startTime: { "$gte": today } });
    const todayRevenue = await Bill.aggregate([
      { "$match": { paidAt: { "$gte": today } } },
      { "$group": { _id: null, total: { "$sum": "$total" } } }
    ]);

    res.json({
      totalTables,
      occupiedTables,
      activeSessions,
      pendingOrders,
      todaySessions,
      todayRevenue: todayRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalTables = await Table.countDocuments();
    const occupiedTables = await Table.countDocuments({ status: "OCCUPIED" });
    const activeSessions = await Session.countDocuments({ status: "ACTIVE" });
    const pendingOrders = await Order.countDocuments({ status: { "$in": ["PENDING", "CONFIRMED", "PREPARING"] } });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todaySessions = await Session.countDocuments({ startTime: { "$gte": today } });

    const todayRevenue = await Bill.aggregate([
      { "$match": { paidAt: { "$gte": today } } },
      { "$group": { _id: null, total: { "$sum": "$total" } } }
    ]);

    const totalBills = await Bill.countDocuments();
    const billAgg = await Bill.aggregate([
      { "$group": { _id: null, totalRevenue: { "$sum": "$total" }, avgBill: { "$avg": "$total" } } }
    ]);

    res.json({
      totalTables,
      occupiedTables,
      availableTables: totalTables - occupiedTables,
      activeSessions,
      pendingOrders,
      todaySessions,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalBills,
      totalRevenue: billAgg[0]?.totalRevenue || 0,
      avgBill: Math.round(billAgg[0]?.avgBill || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const revenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate) match.paidAt = { ...match.paidAt, "$gte": new Date(startDate) };
    if (endDate) match.paidAt = { ...match.paidAt, "$lte": new Date(endDate) };
    if (!startDate && !endDate) {
      const d = new Date(); d.setHours(0, 0, 0, 0);
      match.paidAt = { "$gte": d };
    }

    const result = await Bill.aggregate([
      { "$match": match },
      { "$group": { _id: null, totalRevenue: { "$sum": "$total" }, count: { "$sum": 1 } } }
    ]);

    res.json(result[0] || { totalRevenue: 0, count: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTopItems = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topItems = await OrderItem.aggregate([
      { "$match": { status: { "$nin": ["CANCELLED"] } } },
      {
        "$group": {
          _id: "$menuItemId",
          totalQuantity: { "$sum": "$quantity" },
          orderCount: { "$sum": 1 }
        }
      },
      { "$sort": { totalQuantity: -1 } },
      { "$limit": limit },
      {
        "$lookup": {
          from: "menuitems",
          localField: "_id",
          foreignField: "_id",
          as: "menuItem"
        }
      },
      { "$unwind": "$menuItem" },
      {
        "$project": {
          _id: 1,
          totalQuantity: 1,
          orderCount: 1,
          "menuItem.name": 1,
          "menuItem.price": 1,
          "menuItem.category": 1,
          "menuItem.image": 1
        }
      }
    ]);

    res.json(topItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const recentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort("-createdAt")
      .limit(20)
      .populate("sessionId", "tableId");

    const enriched = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ orderId: order._id }).populate("menuItemId", "name price");
      return { ...order.toObject(), items };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};