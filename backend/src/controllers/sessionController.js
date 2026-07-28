import Session from '../models/Session.js';
import Table from '../models/Table.js';
import { emitTableUpdated } from '../socket/index.js';

export const openSession = async (req, res) => {
  try {
    const { tableId } = req.body;
    if (!tableId) return res.status(400).json({ error: 'tableId is required' });

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ error: 'Table not found' });
    if (table.status === 'OCCUPIED') return res.status(400).json({ error: 'Table is already occupied' });

    const session = await Session.create({ tableId, startTime: new Date(), status: 'ACTIVE', totalAmount: 0 });

    table.status = 'OCCUPIED';
    table.currentSessionId = session._id;
    await table.save();

    emitTableUpdated(table);

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const closeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { status: 'CLOSED', endTime: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const table = await Table.findByIdAndUpdate(
      session.tableId,
      { status: 'AVAILABLE', currentSessionId: null },
      { new: true }
    );

    if (table) emitTableUpdated(table);

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};