const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const dotenv = require("dotenv");
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

// Simple models inline to avoid ES module issues
const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  status: { type: String, enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"], default: "AVAILABLE" },
  currentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", default: null },
}, { timestamps: true });
const Table = mongoose.model("Table", tableSchema);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });
const Category = mongoose.model("Category", categorySchema);

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  isAvailable: { type: Boolean, default: true },
  aiDescription: { type: String, default: "" },
  upsellSuggestion: { type: String, default: "" },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
}, { timestamps: true });
const MenuItem = mongoose.model("MenuItem", menuItemSchema);

const sessionSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  status: { type: String, enum: ["ACTIVE", "CLOSED"], default: "ACTIVE" },
  totalAmount: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
}, { timestamps: true });
const Session = mongoose.model("Session", sessionSchema);

const orderSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  status: { type: String, enum: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"], default: "PENDING" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
const Order = mongoose.model("Order", orderSchema);

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  quantity: { type: Number, default: 1 },
  note: { type: String, default: "" },
  status: { type: String, default: "PENDING" },
}, { timestamps: true });
const OrderItem = mongoose.model("OrderItem", orderItemSchema);

const billSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true, unique: true },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["CASH", "CARD", "BANK_TRANSFER", "E_WALLET"], required: true },
  paidAt: { type: Date, default: Date.now },
}, { timestamps: true });
const Bill = mongoose.model("Bill", billSchema);


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["ADMIN", "STAFF"], default: "ADMIN" },
}, { timestamps: true });
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
const User = mongoose.model("User", userSchema);
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
    Bill.deleteMany({}), User.deleteMany({}),
  ]);

  // Create Tables
  console.log("Creating tables...");
  const tables = await Table.insertMany([
    { number: 1, status: "OCCUPIED" },
    { number: 2, status: "AVAILABLE" },
    { number: 3, status: "OCCUPIED" },
    { number: 4, status: "AVAILABLE" },
    { number: 5, status: "RESERVED" },
    { number: 6, status: "AVAILABLE" },
    { number: 7, status: "OCCUPIED" },
    { number: 8, status: "AVAILABLE" },
    { number: 9, status: "CLEANING" },
    { number: 10, status: "AVAILABLE" },
    { number: 11, status: "OCCUPIED" },
    { number: 12, status: "RESERVED" },
    { number: 13, status: "AVAILABLE" },
    { number: 14, status: "AVAILABLE" },
    { number: 15, status: "OCCUPIED" },
    { number: 16, status: "AVAILABLE" },
    { number: 17, status: "OCCUPIED" },
    { number: 18, status: "AVAILABLE" },
    { number: 19, status: "AVAILABLE" },
    { number: 20, status: "OCCUPIED" },
    { number: 21, status: "AVAILABLE" },
    { number: 22, status: "CLEANING" },
    { number: 23, status: "AVAILABLE" },
    { number: 24, status: "OCCUPIED" },
  ]);

  // Create Categories
  console.log("Creating categories...");
  const categories = await Category.insertMany([
    { name: "Appetizers", order: 1 },
    { name: "Main Course", order: 2 },
    { name: "Desserts", order: 3 },
    { name: "Beverages", order: 4 },
  ]);
  const [appetizers, mainCourse, desserts, beverages] = categories;

  // Create Menu Items
  console.log("Creating menu items...");
  const menuItems = await MenuItem.insertMany([
    { name: "Wagyu Beef Tartare", price: 58, description: "Hand-cut wagyu, quail egg, caper berries", categoryId: appetizers._id, isAvailable: true },
    { name: "Omakase Sushi Platter", price: 45, description: "12 seasonal nigiri, chef's selection", categoryId: appetizers._id, isAvailable: true },
    { name: "Crispy Calamari", price: 18, description: "Lightly battered, sriracha aioli", categoryId: appetizers._id, isAvailable: true },
    { name: "Bruschetta Trio", price: 16, description: "Tomato basil, mushroom, olive tapenade", categoryId: appetizers._id, isAvailable: true },
    { name: "Ribeye Steak 300g", price: 95, description: "Dry-aged USDA Prime, truffle mash", categoryId: mainCourse._id, isAvailable: true },
    { name: "Duck Confit", price: 72, description: "Slow-cooked duck leg, cherry gastrique", categoryId: mainCourse._id, isAvailable: true },
    { name: "Pan-Seared Salmon", price: 38, description: "Atlantic salmon, lemon butter, asparagus", categoryId: mainCourse._id, isAvailable: true },
    { name: "Truffle Pasta", price: 42, description: "House-made fettuccine, black truffle cream", categoryId: mainCourse._id, isAvailable: true },
    { name: "Lobster Bisque", price: 28, description: "Creamy bisque, cognac, chives", categoryId: mainCourse._id, isAvailable: false },
    { name: "Midnight Lava Cake", price: 12, description: "Molten Belgian chocolate, vanilla ice cream", categoryId: desserts._id, isAvailable: true },
    { name: "Cr�me Br�l�e", price: 14, description: "Madagascar vanilla, caramelized sugar", categoryId: desserts._id, isAvailable: true },
    { name: "Tiramisu", price: 15, description: "Espresso-soaked ladyfingers, mascarpone", categoryId: desserts._id, isAvailable: true },
    { name: "Solaris Cocktail", price: 19, description: "House-blended smoked bourbon", categoryId: beverages._id, isAvailable: true },
    { name: "Espresso Martini", price: 18, description: "Vodka, Kahlua, fresh espresso", categoryId: beverages._id, isAvailable: true },
    { name: "Sparkling Yuzu", price: 14, description: "Yuzu, sparkling water, fresh mint", categoryId: beverages._id, isAvailable: true },
    { name: "Pinot Noir Glass", price: 12, description: "Willamette Valley, 2022", categoryId: beverages._id, isAvailable: true },
  ]);

  // Create 2 recent Sessions with Bills (for dashboard revenue)
  console.log("Creating sessions and orders...");

  const session1 = await Session.create({ tableId: tables[0]._id, status: "CLOSED", totalAmount: 385, startTime: new Date(Date.now() - 3*86400000), endTime: new Date(Date.now() - 3*86400000 + 7200000) });
  const session2 = await Session.create({ tableId: tables[6]._id, status: "CLOSED", totalAmount: 210, startTime: new Date(Date.now() - 2*86400000), endTime: new Date(Date.now() - 2*86400000 + 5400000) });
  const session3 = await Session.create({ tableId: tables[14]._id, status: "CLOSED", totalAmount: 152, startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 86400000 + 3600000) });
  const session4 = await Session.create({ tableId: tables[2]._id, status: "CLOSED", totalAmount: 672, startTime: new Date(Date.now() - 86400000), endTime: new Date(Date.now() - 86400000 + 5400000) });

  // Create active sessions
  const session5 = await Session.create({ tableId: tables[0]._id, status: "ACTIVE", totalAmount: 132, startTime: new Date(Date.now() - 3600000) });
  const session6 = await Session.create({ tableId: tables[13]._id, status: "ACTIVE", totalAmount: 95, startTime: new Date(Date.now() - 7200000) });
  const session7 = await Session.create({ tableId: tables[16]._id, status: "ACTIVE", totalAmount: 245, startTime: new Date(Date.now() - 1800000) });
  const session8 = await Session.create({ tableId: tables[19]._id, status: "ACTIVE", totalAmount: 58, startTime: new Date(Date.now() - 900000) });

  // Create orders
  const order1 = await Order.create({ sessionId: session5._id, status: "READY", createdAt: new Date(Date.now() - 3600000) });
  const order2 = await Order.create({ sessionId: session5._id, status: "SERVED", createdAt: new Date(Date.now() - 3000000) });
  const order3 = await Order.create({ sessionId: session6._id, status: "CONFIRMED", createdAt: new Date(Date.now() - 7200000) });
  const order4 = await Order.create({ sessionId: session7._id, status: "PENDING", createdAt: new Date(Date.now() - 1800000) });
  const order5 = await Order.create({ sessionId: session8._id, status: "PREPARING", createdAt: new Date(Date.now() - 900000) });
  const order6 = await Order.create({ sessionId: session5._id, status: "CANCELLED", createdAt: new Date(Date.now() - 600000) });

  // Orders for closed sessions
  const order7 = await Order.create({ sessionId: session1._id, status: "SERVED", createdAt: new Date(Date.now() - 3*86400000) });
  const order8 = await Order.create({ sessionId: session1._id, status: "SERVED", createdAt: new Date(Date.now() - 3*86400000 + 3600000) });
  const order9 = await Order.create({ sessionId: session2._id, status: "SERVED", createdAt: new Date(Date.now() - 2*86400000) });
  const order10 = await Order.create({ sessionId: session3._id, status: "SERVED", createdAt: new Date(Date.now() - 86400000) });
  const order11 = await Order.create({ sessionId: session4._id, status: "SERVED", createdAt: new Date(Date.now() - 86400000) });
  const order12 = await Order.create({ sessionId: session4._id, status: "SERVED", createdAt: new Date(Date.now() - 86400000 + 1800000) });

  // Create order items
  const items = [
    { orderId: order1._id, menuItemId: menuItems[0]._id, quantity: 2, note: "No onion" },      // Wagyu x2
    { orderId: order1._id, menuItemId: menuItems[12]._id, quantity: 1, note: "" },              // Solaris
    { orderId: order2._id, menuItemId: menuItems[9]._id, quantity: 2, note: "" },               // Lava cake x2
    { orderId: order2._id, menuItemId: menuItems[13]._id, quantity: 1, note: "" },              // Espresso Martini
    { orderId: order3._id, menuItemId: menuItems[4]._id, quantity: 1, note: "Medium rare" },     // Ribeye
    { orderId: order4._id, menuItemId: menuItems[5]._id, quantity: 1, note: "" },               // Duck Confit
    { orderId: order4._id, menuItemId: menuItems[15]._id, quantity: 2, note: "" },              // Pinot Noir x2
    { orderId: order5._id, menuItemId: menuItems[7]._id, quantity: 1, note: "" },               // Truffle Pasta
    { orderId: order6._id, menuItemId: menuItems[2]._id, quantity: 1, note: "Allergy alert" },  // Calamari (cancelled)
    // Closed session items
    { orderId: order7._id, menuItemId: menuItems[4]._id, quantity: 2, note: "" },
    { orderId: order7._id, menuItemId: menuItems[15]._id, quantity: 3, note: "" },
    { orderId: order8._id, menuItemId: menuItems[1]._id, quantity: 1, note: "" },
    { orderId: order8._id, menuItemId: menuItems[11]._id, quantity: 2, note: "" },
    { orderId: order9._id, menuItemId: menuItems[6]._id, quantity: 1, note: "" },
    { orderId: order9._id, menuItemId: menuItems[14]._id, quantity: 2, note: "" },
    { orderId: order10._id, menuItemId: menuItems[5]._id, quantity: 1, note: "" },
    { orderId: order10._id, menuItemId: menuItems[13]._id, quantity: 1, note: "" },
    { orderId: order11._id, menuItemId: menuItems[0]._id, quantity: 3, note: "" },
    { orderId: order11._id, menuItemId: menuItems[8]._id, quantity: 2, note: "" },
    { orderId: order12._id, menuItemId: menuItems[7]._id, quantity: 2, note: "" },
    { orderId: order12._id, menuItemId: menuItems[10]._id, quantity: 3, note: "" },
  ];
  await OrderItem.insertMany(items);

  // Create bills for closed sessions
  const now = new Date();

  console.log("Creating default admin user...");
  await User.create({ username: "admin", password: await bcrypt.hash("admin123", 10), role: "ADMIN" });
  await Bill.insertMany([
    { sessionId: session1._id, total: 385, paymentMethod: "CARD", paidAt: new Date(now - 3*86400000) },
    { sessionId: session2._id, total: 210, paymentMethod: "CASH", paidAt: new Date(now - 2*86400000) },
    { sessionId: session3._id, total: 152, paymentMethod: "E_WALLET", paidAt: new Date(now - 86400000) },
    { sessionId: session4._id, total: 672, paymentMethod: "CARD", paidAt: new Date(now - 86400000) },
  ]);

  console.log("Done! Created:");
  console.log("  - " + tables.length + " tables");
  console.log("  - " + categories.length + " categories");
  console.log("  - " + menuItems.length + " menu items");
  console.log("  - 8 sessions (4 closed, 4 active)");
  console.log("  - 12 orders");
  console.log("  - 22 order items");
  console.log("  - 4 bills ($1,419 total revenue)");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
