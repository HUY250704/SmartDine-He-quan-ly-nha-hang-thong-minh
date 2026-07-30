import Session from "../models/Session.js";
import Table from "../models/Table.js";
import { emitTableUpdated } from "../socket/index.js";

export const openSession = async (req, res) => {
  try {
    const { tableId } = req.body;
    if (!tableId) return res.status(400).json({ error: "tableId is required" });

    let table = await Table.findOne({ number: Number(tableId) });
    if (!table) {
      table = await Table.findById(tableId);
    }
    if (!table) return res.status(404).json({ error: "Table not found" });

    const existingActive = await Session.findOne({ tableId: table._id, status: "ACTIVE" });
    if (existingActive) {
      return res.status(400).json({ error: "Table is already occupied" });
    }

    const session = await Session.create({ tableId: table._id, startTime: new Date(), status: "ACTIVE", totalAmount: 0 });

    table.status = "OCCUPIED";
    table.currentSessionId = session._id;
    await table.save();

    emitTableUpdated(table);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const switchTable = async (req, res) => {
  try {
    const { sessionId, newTableId } = req.body;
    if (!sessionId || !newTableId) {
      return res.status(400).json({ error: "sessionId and newTableId are required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "ACTIVE") return res.status(400).json({ error: "Session is not active" });

    // Find the new table
    let newTable = await Table.findOne({ number: Number(newTableId) });
    if (!newTable) {
      newTable = await Table.findById(newTableId);
    }
    if (!newTable) return res.status(404).json({ error: "New table not found" });

    // Cannot switch to the same table
    if (newTable._id.toString() === session.tableId.toString()) {
      return res.status(400).json({ error: "Cannot switch to the same table" });
    }

    // Check new table is not occupied by another active session
    const newTableActive = await Session.findOne({ tableId: newTable._id, status: "ACTIVE" });
    if (newTableActive) {
      return res.status(400).json({ error: "New table is already occupied" });
    }

    const oldTableId = session.tableId;

    // Move session to new table
    session.tableId = newTable._id;
    await session.save();

    // Free old table
    const oldTable = await Table.findByIdAndUpdate(oldTableId, {
      status: "AVAILABLE",
      currentSessionId: null
    }, { new: true });

    // Occupy new table
    newTable.status = "OCCUPIED";
    newTable.currentSessionId = session._id;
    await newTable.save();

    if (oldTable) emitTableUpdated(oldTable);
    emitTableUpdated(newTable);

    const populated = await Session.findById(session._id).populate("tableId", "number");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { status: "CLOSED", endTime: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    const table = await Table.findByIdAndUpdate(
      session.tableId,
      { status: "AVAILABLE", currentSessionId: null },
      { new: true }
    );

    if (table) emitTableUpdated(table);

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getActiveSessionByTable = async (req, res) => {
  try {
    const id = req.params.id;
    let table = await Table.findOne({ number: Number(id) });
    if (!table) {
      table = await Table.findById(id);
    }
    if (!table) return res.json(null);

    const session = await Session.findOne({ tableId: table._id, status: "ACTIVE" })
      .populate("tableId", "number");
    if (!session) return res.json(null);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
