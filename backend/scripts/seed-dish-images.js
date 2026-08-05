import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

// ========== DISH IMAGE MAP ==========
// High-quality Unsplash photos (free, no API key needed)
const DISH_IMAGE_MAP = {
  // Appetizers / Khai vị
  "Chả giò": "https://images.unsplash.com/photo-1539735257917-5e5b6e4a1c9c?w=800&q=80",
  "Gỏi cuốn": "https://images.unsplash.com/photo-1553502678-2f39c9c40c41?w=800&q=80",
  "Nem nướng": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
  "Bánh xèo": "https://images.unsplash.com/photo-1610366398516-46e1dcdc7e41?w=800&q=80",
  "Súp cua": "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=800&q=80",

  // Noodles / Phở - Bún
  "Phở bò": "https://images.unsplash.com/photo-1519098757744-8c2e8f365e84?w=800&q=80",
  "Phở gà": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80",
  "Bún bò Huế": "https://images.unsplash.com/photo-1603484390252-4e8c5e67b7db?w=800&q=80",
  "Bún chả": "https://images.unsplash.com/photo-1572449043416-55f6e5f5f9c8?w=800&q=80",
  "Bún thịt nướng": "https://images.unsplash.com/photo-1628801941410-0c40284f5c1c?w=800&q=80",
  "Hủ tiếu": "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80",
  "Bánh canh": "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&q=80",
  "Mì xào": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
  "Mì Quảng": "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80",

  // Rice dishes / Cơm
  "Cơm tấm": "https://images.unsplash.com/photo-1645680827507-9f392edfad23?w=800&q=80",
  "Cơm gà": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80",
  "Cơm chiên": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
  "Cơm niêu": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",

  // Meat dishes
  "Bò lúc lắc": "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80",
  "Gà kho": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80",
  "Cá kho tộ": "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80",
  "Thịt kho": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80",
  "Sườn nướng": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  "Thịt nướng": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",

  // Seafood
  "Tôm nướng": "https://images.unsplash.com/photo-1599416435141-af9aa8188dfe?w=800&q=80",
  "Mực chiên": "https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80",
  "Cá hấp": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80",
  "Lẩu hải sản": "https://images.unsplash.com/photo-1614313913007-2c142cf782d2?w=800&q=80",
  "Lẩu Thái": "https://images.unsplash.com/photo-1614313913007-2c142cf782d2?w=800&q=80",

  // Soups
  "Canh chua": "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=800&q=80",
  "Canh": "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=800&q=80",

  // Desserts
  "Chè": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
  "Bánh flan": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80",
  "Kem": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80",
  "Rau câu": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",

  // Drinks
  "Cà phê": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
  "Cà phê sữa": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
  "Trà đá": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80",
  "Trà": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80",
  "Sinh tố": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80",
  "Nước ép": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80",
  "Nước ngọt": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80",
  "Bia": "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80",
  "Rượu": "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",

  // Salads
  "Gỏi": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
  "Salad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",

  // General fallback
  "default": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
};

function findImage(dishName) {
  if (DISH_IMAGE_MAP[dishName]) return DISH_IMAGE_MAP[dishName];

  const dn = dishName.toLowerCase();

  for (const [key, url] of Object.entries(DISH_IMAGE_MAP)) {
    if (key === "default") continue;
    const kw = key.toLowerCase();
    if (dn.includes(kw) || kw.includes(dn)) return url;
  }

  if (/phở|bún|mì|hủ tiếu|bánh canh/i.test(dn)) return "https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80";
  if (/cơm/i.test(dn)) return "https://images.unsplash.com/photo-1645680827507-9f392edfad23?w=800&q=80";
  if (/gà|chicken/i.test(dn)) return "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80";
  if (/bò|beef/i.test(dn)) return "https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80";
  if (/tôm|mực|cá|hải sản|seafood/i.test(dn)) return "https://images.unsplash.com/photo-1563897539633-7374c276c212?w=800&q=80";
  if (/nướng|grill/i.test(dn)) return "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80";
  if (/chè|bánh|kem|tráng|dessert|rau câu/i.test(dn)) return "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80";
  if (/cà phê|trà|sinh tố|nước|bia|rượu|drink/i.test(dn)) return "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80";
  if (/canh|súp|soup|lẩu/i.test(dn)) return "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=800&q=80";
  if (/gỏi|salad/i.test(dn)) return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80";

  return DISH_IMAGE_MAP["default"];
}

async function seedDishImages() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not set in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const collection = db.collection("menuitems");

    const cursor = collection.find({ $or: [{ image: "" }, { image: null }, { image: { $exists: false } }] });
    const items = await cursor.toArray();

    console.log(`Found ${items.length} items without images\n`);

    let updated = 0;

    for (const item of items) {
      const imageUrl = findImage(item.name);
      await collection.updateOne({ _id: item._id }, { $set: { image: imageUrl } });
      console.log(`  ${item.name} -> ${imageUrl.substring(0, 55)}...`);
      updated++;
    }

    console.log(`\nDone! ${updated} items updated with images.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

seedDishImages();
