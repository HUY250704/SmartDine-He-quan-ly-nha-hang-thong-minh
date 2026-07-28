import { emitSupportRequest } from '../socket/index.js';

export const callStaff = async (req, res) => {
  try {
    const { tableId, message } = req.body;
    if (!tableId) return res.status(400).json({ error: 'tableId is required' });

    const data = { tableId, message: message || 'Customer needs assistance', timestamp: new Date() };
    emitSupportRequest(data);

    res.json({ success: true, message: 'Staff has been notified', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const data = { sessionId, type: 'PAYMENT_REQUEST', message: 'Customer requests payment', timestamp: new Date() };
    emitSupportRequest(data);

    res.json({ success: true, message: 'Payment requested', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};