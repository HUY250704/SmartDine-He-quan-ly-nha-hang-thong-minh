import stripe from '../config/stripe.js';
import Session from '../models/Session.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Bill from '../models/Bill.js';
import Table from '../models/Table.js';
import { emitTableUpdated } from '../socket/index.js';

// Tạo PaymentIntent để khách nhập thẻ
export const createPaymentIntent = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Tính tổng tiền từ orders
    const orders = await Order.find({ sessionId, status: { '$ne': 'CANCELLED' } });
    let subtotal = 0;

    for (const order of orders) {
      const items = await OrderItem.find({ orderId: order._id }).populate('menuItemId', 'price');
      for (const it of items) {
        subtotal += (it.menuItemId?.price || 0) * (it.quantity || 1);
      }
    }

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100); // Stripe dùng cents

    if (total <= 0) {
      return res.status(400).json({ error: 'No items to charge' });
    }

    // Tạo PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      metadata: {
        sessionId: sessionId,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
      },
      description: `SmartDine - Table session ${sessionId}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: total,
      amountDisplay: (total / 100).toFixed(2),
    });
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Xác nhận thanh toán thành công từ FE và tạo bill
export const confirmStripePayment = async (req, res) => {
  try {
    const { sessionId, paymentIntentId } = req.body;
    if (!sessionId || !paymentIntentId) {
      return res.status(400).json({ error: 'sessionId and paymentIntentId are required' });
    }

    // Verify PaymentIntent với Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed. Current status: ' + paymentIntent.status });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    const existingBill = await Bill.findOne({ sessionId });
    if (existingBill) {
      return res.json(existingBill);
    }

    // Lấy chi tiết items
    const orders = await Order.find({ sessionId, status: { '$ne': 'CANCELLED' } });
    const billItems = [];
    let subtotal = 0;

    for (const order of orders) {
      const items = await OrderItem.find({ orderId: order._id }).populate('menuItemId', 'name price image');
      for (const it of items) {
        const price = (it.menuItemId?.price || 0);
        const qty = it.quantity || 1;
        billItems.push({
          name: it.menuItemId?.name || 'Item',
          quantity: qty,
          price: price,
          image: it.menuItemId?.image || '',
        });
        subtotal += price * qty;
      }
    }

    // Merge identical items (price is unit price, only add quantity)
    const merged = [];
    billItems.forEach((item) => {
      const existing = merged.find((m) => m.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        merged.push(item);
      }
    });

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

    const table = await Table.findById(session.tableId);
    const tableNumber = table ? table.number : null;

    const bill = await Bill.create({
      sessionId,
      tableNumber,
      items: merged,
      subtotal,
      tax,
      serviceCharge,
      total,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      stripePaymentIntentId: paymentIntentId,
      paidAt: new Date(),
    });

    // Đóng session
    session.status = 'CLOSED';
    session.endTime = new Date();
    await session.save();

    // Giải phóng bàn
    await Table.findByIdAndUpdate(session.tableId, {
      status: 'CLEANING',
      currentSessionId: null,
    }, { new: true }).then((t) => { if (t) emitTableUpdated(t); });

    res.status(201).json(bill);
  } catch (error) {
    console.error('Stripe confirm error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Webhook nhận callback từ Stripe (fallback)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Xử lý event payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const sessionId = paymentIntent.metadata?.sessionId;

    if (sessionId) {
      try {
        const session = await Session.findById(sessionId);
        if (session && session.status === 'ACTIVE') {
          // Tự động tạo bill qua webhook nếu FE chưa xác nhận
          const existingBill = await Bill.findOne({ sessionId });
          if (!existingBill) {
            const orders = await Order.find({ sessionId, status: { '$ne': 'CANCELLED' } });
            const billItems = [];
            let subtotal = 0;

            for (const order of orders) {
              const items = await OrderItem.find({ orderId: order._id }).populate('menuItemId', 'name price');
              for (const it of items) {
                const price = (it.menuItemId?.price || 0);
                const qty = it.quantity || 1;
                billItems.push({ name: it.menuItemId?.name || 'Item', quantity: qty, price, image: it.menuItemId?.image || '' });
                subtotal += price * qty;
              }
            }

            // Merge identical items (price is unit price, only add quantity)
            const merged = [];
            billItems.forEach((item) => {
              const existing = merged.find((m) => m.name === item.name);
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                merged.push(item);
              }
            });

            const tax = Math.round(subtotal * 0.08 * 100) / 100;
            const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;
            const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;

            const table = await Table.findById(session.tableId);

            await Bill.create({
              sessionId,
              tableNumber: table?.number,
              items: merged,
              subtotal,
              tax,
              serviceCharge,
              total,
              paymentMethod: 'CARD',
              paymentStatus: 'PAID',
              stripePaymentIntentId: paymentIntent.id,
              paidAt: new Date(),
            });

            session.status = 'CLOSED';
            session.endTime = new Date();
            await session.save();

            await Table.findByIdAndUpdate(session.tableId, {
              status: 'CLEANING',
              currentSessionId: null,
            }, { new: true }).then((t) => { if (t) emitTableUpdated(t); });

            console.log('Webhook: bill auto-created for session', sessionId);
          }
        }
      } catch (innerErr) {
        console.error('Webhook processing error:', innerErr.message);
      }
    }
  }

  res.json({ received: true });
};
