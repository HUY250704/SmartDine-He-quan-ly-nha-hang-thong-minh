import stripe from '../config/stripe.js';
import Session from '../models/Session.js';
import Order from '../models/Order.js';
import OrderItem from '../models/OrderItem.js';
import Bill from '../models/Bill.js';
import Table from '../models/Table.js';
import { emitTableUpdated, emitBillCreated } from '../socket/index.js';
import { batchOrderItems } from '../utils/batchHelpers.js';
import { normalizeVND, calcTotals } from '../utils/price.js';

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
    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds, 'price');

    let subtotal = 0;
    for (const order of orders) {
      for (const it of (itemsMap.get(order._id.toString()) || [])) {
        subtotal += normalizeVND(it.menuItemId?.price) * (it.quantity || 1);
      }
    }

    const { tax, serviceCharge, total } = calcTotals(subtotal);

    if (total <= 0) {
      return res.status(400).json({ error: 'No items to charge' });
    }

    // T?o PaymentIntent (VND, amount l? s? nguy?n ??ng)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'vnd',
      metadata: {
        sessionId: sessionId,
        subtotal: String(subtotal),
        tax: String(tax),
        serviceCharge: String(serviceCharge),
      },
      description: `SmartDine - Table session ${sessionId}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: total,
      amountDisplay: total.toLocaleString('vi-VN'),
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
      return res.status(400).json({ error: "sessionId and paymentIntentId are required" });
    }

    // Verify PaymentIntent v?i Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not completed. Current status: " + paymentIntent.status });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.status !== "ACTIVE") {
      return res.status(400).json({ error: "Session is not active" });
    }

    const existingBill = await Bill.findOne({ sessionId });
    if (existingBill) {
      return res.json(existingBill);
    }

    // L?y chi ti?t items
    const orders = await Order.find({ sessionId, status: { "$ne": "CANCELLED" } });
    const orderIds = orders.map(o => o._id);
    const itemsMap = await batchOrderItems(orderIds, "name price image");

    const billItems = [];
    let subtotal = 0;

    for (const order of orders) {
      const items = itemsMap.get(order._id.toString()) || [];
      for (const it of items) {
        const price = normalizeVND(it.menuItemId?.price);
        const qty = it.quantity || 1;
        billItems.push({
          name: it.menuItemId?.name || "Item",
          quantity: qty,
          price: price,
          image: it.menuItemId?.image || "",
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

    const { tax, serviceCharge, total } = calcTotals(subtotal);

    const table = await Table.findById(session.tableId);
    const tableNumber = table ? table.number : null;

    let bill;
    try {
      bill = await Bill.create({
        sessionId,
        tableNumber,
        items: merged,
        subtotal,
        tax,
        serviceCharge,
        total,
        paymentMethod: "CARD",
        paymentStatus: "PAID",
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        const concurrent = await Bill.findOne({ sessionId });
        if (concurrent) {
          return res.json(concurrent);
        }
        throw createErr;
      }
      throw createErr;
    }

    // ��ng session
    session.status = "CLOSED";
    session.endTime = new Date();
    await session.save();

    // Gi?i ph�ng b�n
    await Table.findByIdAndUpdate(session.tableId, {
      status: "CLEANING",
      currentSessionId: null,
    }, { new: true }).then((t) => { if (t) emitTableUpdated(t); });

    // Populate and emit to socket admins
    Bill.findById(bill._id)
      .populate({
        path: "sessionId",
        populate: { path: "tableId", select: "number" }
      })
      .then((popBill) => {
        if (popBill) emitBillCreated(popBill);
      })
      .catch((err) => console.error("Error emitting bill:", err));

    res.status(201).json(bill);
  } catch (error) {
    console.error("Stripe confirm error:", error.message);
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
          const existingBill = await Bill.findOne({ sessionId });
          if (!existingBill) {
            const orders = await Order.find({ sessionId, status: { '$ne': 'CANCELLED' } });
            const orderIds = orders.map(o => o._id);
            const itemsMap = await batchOrderItems(orderIds);

            const billItems = [];
            let subtotal = 0;

            for (const order of orders) {
              const items = itemsMap.get(order._id.toString()) || [];
              for (const it of items) {
                const price = normalizeVND(it.menuItemId?.price);
                const qty = it.quantity || 1;
                billItems.push({ name: it.menuItemId?.name || 'Item', quantity: qty, price, image: it.menuItemId?.image || '' });
                subtotal += price * qty;
              }
            }

            const merged = [];
            billItems.forEach((item) => {
              const existing = merged.find((m) => m.name === item.name);
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                merged.push(item);
              }
            });

            const { tax, serviceCharge, total } = calcTotals(subtotal);

            const table = await Table.findById(session.tableId);

            try {
              const hookBill = await Bill.create({
                sessionId,
                tableNumber: table?.number,
                items: merged,
                subtotal,
                tax,
                serviceCharge,
                total,
                paymentMethod: "CARD",
                paymentStatus: "PAID",
                stripePaymentIntentId: paymentIntent.id,
                paidAt: new Date(),
              });

              // Populate and emit to socket admins
              Bill.findById(hookBill._id)
                .populate({
                  path: "sessionId",
                  populate: { path: "tableId", select: "number" }
                })
                .then((popBill) => {
                  if (popBill) emitBillCreated(popBill);
                })
                .catch((err) => console.error("Error emitting webhook bill:", err));

            } catch (createErr) {
              if (createErr.code !== 11000) throw createErr;
              // If it already exists, let's fetch and emit anyway in case it wasn't emitted
              Bill.findOne({ sessionId })
                .populate({
                  path: "sessionId",
                  populate: { path: "tableId", select: "number" }
                })
                .then((popBill) => {
                  if (popBill) emitBillCreated(popBill);
                })
                .catch(() => {});
            }

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
