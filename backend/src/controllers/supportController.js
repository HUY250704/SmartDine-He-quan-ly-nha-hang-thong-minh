export const callStaff = async (req, res) => {
  try {
    const { tableId, message } = req.body;
    if (!tableId) return res.status(400).json({ error: 'tableId is required' });

    // In real app, emit socket event to admin dashboard
    res.json({ success: true, message: 'Staff has been notified', data: { tableId, message: message || 'Customer needs assistance' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    // In real app, emit socket event to admin dashboard
    res.json({ success: true, message: 'Payment requested', data: { sessionId } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};