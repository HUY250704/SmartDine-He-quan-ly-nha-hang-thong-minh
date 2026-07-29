import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";

const categories = [
  { id: "all", name: "All", icon: "apps" },
  { id: "appetizer", name: "Appetizers", icon: "tapas" },
  { id: "main", name: "Main Course", icon: "dinner_dining" },
  { id: "dessert", name: "Desserts", icon: "cake" },
  { id: "drinks", name: "Drinks", icon: "local_bar" },
];

const menuItems = [
  { id: 1, name: "Wagyu Beef Tartare", price: 580000, category: "appetizer", image: "🥩", desc: "Hand-cut wagyu, quail egg, caper berries, sourdough crisp", popular: true },
  { id: 2, name: "Lobster Bisque", price: 420000, category: "appetizer", image: "🦞", desc: "Cognac cream, tarragon oil, brioche croutons" },
  { id: 3, name: "Truffle Burrata", price: 380000, category: "appetizer", image: "🧀", desc: "Heirloom tomatoes, basil pesto, aged balsamic, black truffle" },
  { id: 4, name: "Pan-Seared Salmon", price: 650000, category: "main", image: "🐟", desc: "Miso glaze, baby bok choy, ginger-soy reduction" },
  { id: 5, name: "Ribeye Steak 300g", price: 950000, category: "main", image: "🥩", desc: "Dry-aged USDA Prime, truffle mash, peppercorn sauce", popular: true },
  { id: 6, name: "Duck Confit", price: 720000, category: "main", image: "🦆", desc: "Slow-cooked duck leg, cherry gastrique, root vegetables" },
  { id: 7, name: "Chocolate Lava Cake", price: 280000, category: "dessert", image: "🍫", desc: "Molten Belgian chocolate, vanilla ice cream, gold leaf" },
  { id: 8, name: "Crème Brûlée", price: 220000, category: "dessert", image: "🍮", desc: "Madagascar vanilla, caramelized sugar, seasonal berries" },
  { id: 9, name: "Signature Old Fashioned", price: 195000, category: "drinks", image: "🥃", desc: "House-infused bourbon, aromatic bitters, orange twist" },
  { id: 10, name: "Sparkling Yuzu", price: 145000, category: "drinks", image: "🍹", desc: "Yuzu, sparkling water, fresh mint, honey syrup" },
  { id: 11, name: "Espresso Martini", price: 175000, category: "drinks", image: "🍸", desc: "Fresh espresso, vanilla vodka, coffee liqueur", popular: true },
];

export default function MenuPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [showToast, setShowToast] = useState(null);
  const formatPrice = p => p.toLocaleString("vi-VN") + "đ";

  const addToCart = (item) => {
    setCart(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) return prev.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...item, qty: 1}];
    });
    setShowToast(item.name);
    setTimeout(() => setShowToast(null), 2000);
  };

  const filtered = activeCategory === "all" ? menuItems : menuItems.filter(i => i.category === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-bold animate-[slideDown_0.3s_ease]"
          style={{ background: "rgba(86,229,169,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(86,229,169,0.3)", color: "#56e5a9" }}>
          Added "{showToast}" to cart
        </div>
      )}

      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.menu")}</h1>
          <button onClick={() => navigate(`/customer/${tableId}/cart`)} className="relative">
            <span className="material-symbols-outlined text-xl text-primary">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto category-scroll">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id ? "bg-primary/20 text-primary border border-primary/30" : "text-on-surface-variant hover:text-white hover:bg-white/5"}
              `}>
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>{cat.name}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 grid grid-cols-1 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="rounded-2xl p-4 flex gap-4 group transition-all hover:scale-[1.01]"
            style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-4xl flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
              {item.image}
              {item.popular && <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-bold">TOP</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold">{item.name}</h3>
              <p className="text-on-surface-variant/60 text-xs mt-0.5 line-clamp-2">{item.desc}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-primary font-mono font-bold">{formatPrice(item.price)}</span>
                <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-center active:scale-90 transition-all">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
