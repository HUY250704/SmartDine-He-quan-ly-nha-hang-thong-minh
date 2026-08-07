import SupportRequest from '../models/SupportRequest.js';
import Table from '../models/Table.js';
import { emitSupportRequest } from '../socket/index.js';

export const callStaff = async (req, res) => {
  try {
    const { tableId, message, type } = req.body;
    if (!tableId) return res.status(400).json({ error: 'tableId is required' });

    // tableId from frontend is table number, not MongoDB _id
    const table = await Table.findOne({ number: Number(tableId) });
    if (!table) return res.status(404).json({ error: 'Table not found' });

    const supportRequest = await SupportRequest.create({
      tableId: table._id,
      sessionId: table.currentSessionId,
      type: type || 'assistance',
      message: message || 'Customer needs assistance',
      status: 'pending'
    });

    const populated = await supportRequest.populate('tableId', 'number');

    const data = {
      _id: populated._id,
      tableId: populated.tableId,
      type: populated.type,
      message: populated.message,
      status: populated.status,
      createdAt: populated.createdAt,
      tableNumber: populated.tableId?.number
    };

    emitSupportRequest(data);

    res.json({ success: true, message: 'Staff has been notified', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestPayment = async (req, res) => {
  try {
    const { sessionId, tableId, message } = req.body;
    if (!sessionId && !tableId) return res.status(400).json({ error: 'sessionId or tableId is required' });

    // tableId from frontend is table number, resolve to actual _id
    let resolvedTableId = tableId;
    if (tableId && isNaN(Number(tableId)) === false) {
      const tbl = await Table.findOne({ number: Number(tableId) });
      resolvedTableId = tbl ? tbl._id : tableId;
    }

    const supportRequest = await SupportRequest.create({
      tableId: resolvedTableId,
      sessionId: sessionId || null,
      type: 'payment',
      message: message || 'Customer requests payment',
      status: 'pending'
    });

    const populated = await supportRequest.populate('tableId', 'number');

    const data = {
      _id: populated._id,
      tableId: populated.tableId,
      type: 'payment',
      message: populated.message,
      status: populated.status,
      createdAt: populated.createdAt,
      tableNumber: populated.tableId?.number
    };

    emitSupportRequest(data);

    res.json({ success: true, message: 'Payment requested', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.type = type;

    const requests = await SupportRequest.find(filter)
      .sort('-createdAt')
      .populate('tableId', 'number')
      .limit(100);

    res.json(requests.map(r => ({
      _id: r._id,
      tableId: r.tableId,
      sessionId: r.sessionId,
      type: r.type,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      tableNumber: r.tableId?.number
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const resolveRequest = async (req, res) => {
  try {
    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    ).populate('tableId', 'number');

    if (!request) return res.status(404).json({ error: 'Support request not found' });

    res.json({
      _id: request._id,
      tableId: request.tableId,
      type: request.type,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
      tableNumber: request.tableId?.number
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
