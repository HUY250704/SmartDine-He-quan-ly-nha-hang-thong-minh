import Session from "../models/Session.js";
import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Table from "../models/Table.js";
import Bill from "../models/Bill.js";
import { batchOrderItems } from "../utils/batchHelpers.js";

// Shared data fetching — used by both overview and getStats
async function getStatsData() {
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

  return {
    totalTables,
    occupiedTables,
    availableTables: totalTables - occupiedTables,
    activeSessions,
    pendingOrders,
    todaySessions,
    todayRevenue: todayRevenue[0]?.total || 0,
    totalBills,
    totalRevenue: billAgg[0]?.totalRevenue || 0,
    avgBill: Math.round(billAgg[0]?.avgBill || 0),
  };
}

export const overview = async (req, res) => {
  try {
    const stats = await getStatsData();
    res.json({
      totalTables: stats.totalTables,
      occupiedTables: stats.occupiedTables,
      activeSessions: stats.activeSessions,
      pendingOrders: stats.pendingOrders,
      todaySessions: stats.todaySessions,
      todayRevenue: stats.todayRevenue,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await getStatsData();
    res.json(stats);
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

export const revenueChart = async (req, res) => {
  try {
    const { period = "month" } = req.query;
    const data = [];

    if (period === "month") {
      const now = new Date();
      for (let wk = 0; wk < 4; wk++) {
        const endDate = new Date(now);
        endDate.setDate(now.getDate() - wk * 7);
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);

        const result = await Bill.aggregate([
          { "$match": { paidAt: { "$gte": startDate, "$lte": endDate } } },
          { "$group": { _id: null, total: { "$sum": "$total" } } }
        ]);

        data.unshift({
          label: `Week ${4 - wk}`,
          value: Math.round(result[0]?.total || 0)
        });
      }
    } else {
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for (let d = 6; d >= 0; d--) {
        const day = new Date();
        day.setDate(day.getDate() - d);

        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);

        const result = await Bill.aggregate([
          { "$match": { paidAt: { "$gte": start, "$lte": end } } },
          { "$group": { _id: null, total: { "$sum": "$total" } } }
        ]);

        data.push({
          label: dayNames[(day.getDay() + 6) % 7],
          value: Math.round(result[0]?.total || 0)
        });
      }
    }

    res.json(data);
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
      { "$unwind": { path: "$menuItem", preserveNullAndEmptyArrays: true } },
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
      .populate({
        path: "sessionId",
        select: "tableId",
        populate: { path: "tableId", select: "number" }
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
