let io;

export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.emit('server-message', { message: 'Connected to SmartDine socket server' });

    socket.on('join-admin', () => {
      socket.join('admin');
      console.log('Socket joined admin room:', socket.id);
    });

    socket.on('join-table', (tableId) => {
      socket.join(`table:${tableId}`);
      console.log('Socket joined table room:', socket.id, tableId);
    });

    socket.on('join-session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log('Socket joined session room:', socket.id, sessionId);
    });

    socket.on('leave-table', (tableId) => {
      socket.leave(`table:${tableId}`);
    });

    socket.on('leave-session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};

export const getIO = () => io;

export const emitNewOrder = (sessionId, tableId, order) => {
  if (!io) return;
  const payload = { ...order, tableId };
  io.to('admin').emit('new-order', payload);
  io.to(`session:${sessionId}`).emit('new-order', payload);
};

export const emitOrderUpdated = (sessionId, order) => {
  if (!io) return;
  io.to('admin').emit('order-updated', order);
  io.to(`session:${sessionId}`).emit('order-updated', order);
};

export const emitSupportRequest = (data) => {
  if (!io) return;
  io.to('admin').emit('support-request', data);
};

export const emitTableUpdated = (table) => {
  if (!io) return;
  io.to('admin').emit('table-updated', table);
  io.to(`table:${table._id || table.id}`).emit('table-updated', table);
};

export const emitBillCreated = (bill) => {
  if (!io) return;
  io.to("admin").emit("bill-created", bill);
};
