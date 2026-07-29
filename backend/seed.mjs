import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

// Use existing models
import Table from "./src/models/Table.js";
import Category from "./src/models/Category.js";
import MenuItem from "./src/models/MenuItem.js";
import Session from "./src/models/Session.js";
import Order from "./src/models/Order.js";
import OrderItem from "./src/models/OrderItem.js";
import Bill from "./src/models/Bill.js";

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected. Clearing existing data...");

  await Promise.all([
    Table.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Session.deleteMany({}),
    Order.deleteMany({}),
    OrderItem.deleteMany({}),
    Bill.deleteMany({}),
  ]);

  // Create Tables
  console.log("Creating tables...");
  const tables = await Table.insertMany([
    { number: 1, status: "OCCUPIED" },{ number: 2, status: "AVAILABLE" },{ number: 3, status: "OCCUPIED" },
    { number: 4, status: "AVAILABLE" },{ number: 5, status: "RESERVED" },{ number: 6, status: "AVAILABLE" },
    { number: 7, status: "OCCUPIED" },{ number: 8, status: "AVAILABLE" },{ number: 9, status: "CLEANING" },
    { number: 10, status: "AVAILABLE" },{ number: 11, status: "OCCUPIED" },{ number: 12, status: "RESERVED" },
    { number: 13, status: "AVAILABLE" },{ number: 14, status: "AVAILABLE" },{ number: 15, status: "OCCUPIED" },
    { number: 16, status: "AVAILABLE" },{ number: 17, status: "OCCUPIED" },{ number: 18, status: "AVAILABLE" },
    { number: 19, status: "AVAILABLE" },{ number: 20, status: "OCCUPIED" },{ number: 21, status: "AVAILABLE" },
    { number: 22, status: "CLEANING" },{ number: 23, status: "AVAILABLE" },{ number: 24, status: "OCCUPIED" },
  ]);

  // Categories
  const categories = await Category.insertMany([
    { name: "Appetizers", order: 1 },{ name: "Main Course", order: 2 },
    { name: "Desserts", order: 3 },{ name: "Beverages", order: 4 },
  ]);
  const [appetizers, mainCourse, desserts, beverages] = categories;

  // Menu Items
  const menuItems = await MenuItem.insertMany([
    { name: "Wagyu Beef Tartare", price: 58, description: "Hand-cut wagyu, quail egg, caper berries", categoryId: appetizers._id, isAvailable: true },
    { name: "Omakase Sushi Platter", price: 45, description: "12 seasonal nigiri, chef selection", categoryId: appetizers._id, isAvailable: true },
    { name: "Crispy Calamari", price: 18, description: "Lightly battered, sriracha aioli", categoryId: appetizers._id, isAvailable: true },
    { name: "Bruschetta Trio", price: 16, description: "Tomato basil, mushroom, olive tapenade", categoryId: appetizers._id, isAvailable: true },
    { name: "Ribeye Steak 300g", price: 95, description: "Dry-aged USDA Prime, truffle mash", categoryId: mainCourse._id, isAvailable: true },
    { name: "Duck Confit", price: 72, description: "Slow-cooked duck leg, cherry gastrique", categoryId: mainCourse._id, isAvailable: true },
    { name: "Pan-Seared Salmon", price: 38, description: "Atlantic salmon, lemon butter", categoryId: mainCourse._id, isAvailable: true },
    { name: "Truffle Pasta", price: 42, description: "Fettuccine, black truffle cream", categoryId: mainCourse._id, isAvailable: true },
    { name: "Lobster Bisque", price: 28, description: "Creamy bisque, cognac, chives", categoryId: mainCourse._id, isAvailable: false },
    { name: "Midnight Lava Cake", price: 12, description: "Molten Belgian chocolate, vanilla ice cream", categoryId: desserts._id, isAvailable: true },
    { name: "Crème Brûlée", price: 14, description: "Madagascar vanilla, caramelized sugar", categoryId: desserts._id, isAvailable: true },
    { name: "Tiramisu", price: 15, description: "Espresso ladyfingers, mascarpone", categoryId: desserts._id, isAvailable: true },
    { name: "Solaris Cocktail", price: 19, description: "Smoked bourbon, activated charcoal", categoryId: beverages._id, isAvailable: true },
    { name: "Espresso Martini", price: 18, description: "Vodka, Kahlua, fresh espresso", categoryId: beverages._id, isAvailable: true },
    { name: "Sparkling Yuzu", price: 14, description: "Yuzu, sparkling water, mint", categoryId: beverages._id, isAvailable: true },
    { name: "Pinot Noir Glass", price: 12, description: "Willamette Valley, 2022", categoryId: beverages._id, isAvailable: true },
  ]);

  const now = new Date();
  const dayMs = 86400000;

  // Sessions
  const s1 = await Session.create({ tableId: tables[0]._id, status: "CLOSED", totalAmount: 385, startTime: new Date(now - 3*dayMs), endTime: new Date(now - 3*dayMs + 7200000) });
  const s2 = await Session.create({ tableId: tables[6]._id, status: "CLOSED", totalAmount: 210, startTime: new Date(now - 2*dayMs), endTime: new Date(now - 2*dayMs + 5400000) });
  const s3 = await Session.create({ tableId: tables[14]._id, status: "CLOSED", totalAmount: 152, startTime: new Date(now - dayMs), endTime: new Date(now - dayMs + 3600000) });
  const s4 = await Session.create({ tableId: tables[2]._id, status: "CLOSED", totalAmount: 672, startTime: new Date(now - dayMs), endTime: new Date(now - dayMs + 5400000) });
  const s5 = await Session.create({ tableId: tables[0]._id, status: "ACTIVE", totalAmount: 132, startTime: new Date(now - 3600000) });
  const s6 = await Session.create({ tableId: tables[13]._id, status: "ACTIVE", totalAmount: 95, startTime: new Date(now - 7200000) });
  const s7 = await Session.create({ tableId: tables[16]._id, status: "ACTIVE", totalAmount: 245, startTime: new Date(now - 1800000) });
  const s8 = await Session.create({ tableId: tables[19]._id, status: "ACTIVE", totalAmount: 58, startTime: new Date(now - 900000) });

  // Orders - active
  const o1 = await Order.create({ sessionId: s5._id, status: "READY", createdAt: new Date(now - 3600000) });
  const o2 = await Order.create({ sessionId: s5._id, status: "SERVED", createdAt: new Date(now - 3000000) });
  const o3 = await Order.create({ sessionId: s6._id, status: "CONFIRMED", createdAt: new Date(now - 7200000) });
  const o4 = await Order.create({ sessionId: s7._id, status: "PENDING", createdAt: new Date(now - 1800000) });
  const o5 = await Order.create({ sessionId: s8._id, status: "PREPARING", createdAt: new Date(now - 900000) });
  const o6 = await Order.create({ sessionId: s5._id, status: "CANCELLED", createdAt: new Date(now - 600000) });

  // Orders - closed
  const o7 = await Order.create({ sessionId: s1._id, status: "SERVED", createdAt: new Date(now - 3*dayMs) });
  const o8 = await Order.create({ sessionId: s1._id, status: "SERVED", createdAt: new Date(now - 3*dayMs + 3600000) });
  const o9 = await Order.create({ sessionId: s2._id, status: "SERVED", createdAt: new Date(now - 2*dayMs) });
  const o10 = await Order.create({ sessionId: s3._id, status: "SERVED", createdAt: new Date(now - dayMs) });
  const o11 = await Order.create({ sessionId: s4._id, status: "SERVED", createdAt: new Date(now - dayMs) });
  const o12 = await Order.create({ sessionId: s4._id, status: "SERVED", createdAt: new Date(now - dayMs + 1800000) });

  // Order Items
  const orderItems = [
    { orderId: o1._id, menuItemId: menuItems[0]._id, quantity: 2 }, // Wagyu x2
    { orderId: o1._id, menuItemId: menuItems[12]._id, quantity: 1 }, // Solaris
    { orderId: o2._id, menuItemId: menuItems[9]._id, quantity: 2 }, // Lava x2
    { orderId: o2._id, menuItemId: menuItems[13]._id, quantity: 1 }, // Espresso
    { orderId: o3._id, menuItemId: menuItems[4]._id, quantity: 1 }, // Ribeye
    { orderId: o4._id, menuItemId: menuItems[5]._id, quantity: 1 }, // Duck
    { orderId: o4._id, menuItemId: menuItems[15]._id, quantity: 2 }, // Pinot x2
    { orderId: o5._id, menuItemId: menuItems[7]._id, quantity: 1 }, // Truffle
    { orderId: o6._id, menuItemId: menuItems[2]._id, quantity: 1 }, // Calamari (cancelled)
    { orderId: o7._id, menuItemId: menuItems[4]._id, quantity: 2 },
    { orderId: o7._id, menuItemId: menuItems[15]._id, quantity: 3 },
    { orderId: o8._id, menuItemId: menuItems[1]._id, quantity: 1 },
    { orderId: o8._id, menuItemId: menuItems[11]._id, quantity: 2 },
    { orderId: o9._id, menuItemId: menuItems[6]._id, quantity: 1 },
    { orderId: o9._id, menuItemId: menuItems[14]._id, quantity: 2 },
    { orderId: o10._id, menuItemId: menuItems[5]._id, quantity: 1 },
    { orderId: o10._id, menuItemId: menuItems[13]._id, quantity: 1 },
    { orderId: o11._id, menuItemId: menuItems[0]._id, quantity: 3 },
    { orderId: o11._id, menuItemId: menuItems[8]._id, quantity: 2 },
    { orderId: o12._id, menuItemId: menuItems[7]._id, quantity: 2 },
    { orderId: o12._id, menuItemId: menuItems[10]._id, quantity: 3 },
  ];
  await OrderItem.insertMany(orderItems);

  // Bills for closed sessions
  await Bill.insertMany([
    { sessionId: s1._id, total: 385, paymentMethod: "CARD", paidAt: new Date(now - 3*dayMs) },
    { sessionId: s2._id, total: 210, paymentMethod: "CASH", paidAt: new Date(now - 2*dayMs) },
    { sessionId: s3._id, total: 152, paymentMethod: "E_WALLET", paidAt: new Date(now - dayMs) },
    { sessionId: s4._id, total: 672, paymentMethod: "CARD", paidAt: new Date(now - dayMs) },
  ]);

  console.log("Seed done! 24 tables, 4 categories, 16 menu items, 12 orders, 4 bills ($1,419 revenue)");
  await mongoose.disconnect();
}

seed().catch(e => { console.error("Seed failed:", e.message); process.exit(1); });
