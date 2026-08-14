import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

await import("./src/models/index.js");
const Bill = (await import("./src/models/Bill.js")).default;

await mongoose.connect(process.env.MONGODB_URI);

const bills = await Bill.find().sort("createdAt");
const now = new Date();
const dayMs = 86400000;
const days = [6, 5, 4, 3, 2, 1, 0, 6, 5, 4, 3, 2, 1, 0];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

for (let i = 0; i < bills.length; i++) {
  const daysAgo = days[i % days.length];
  const newDate = new Date(now - daysAgo * dayMs);
  newDate.setHours(12, 0, 0, 0);
  await Bill.findByIdAndUpdate(bills[i]._id, { paidAt: newDate });
  console.log("Bill " + bills[i]._id.toString().slice(-6) + " -> " + dayNames[newDate.getDay()] + " " + bills[i].total.toLocaleString("vi-VN") + "\u0111");
}

console.log("\nDone! " + bills.length + " bills updated.");
await mongoose.disconnect();
