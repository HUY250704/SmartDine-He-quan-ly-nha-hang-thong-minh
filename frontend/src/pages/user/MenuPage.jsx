import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [noteItem, setNoteItem] = useState(null);

  const filtered = activeCategory === "all" ? menuItems : menuItems.filter(i => i.category === activeCategory);

  const addToCart = (item, note = "") => {
    setCart(prev => {
      const exist = prev.find(i => i.id === item.id && i.note === note);
      if (exist) return prev.map(i => i.id === item.id && i.note === note ? {...i, qty: i.qty + 1} : i);
      return [...prev, {...item, qty: 1, note}];
    });
    setNoteItem(null);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const formatPrice = p => p.toLocaleString("vi-VN") + "đ";

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(`/customer/${tableId}`)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span><span className="text-sm font-medium">Table {tableId}</span>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white text-center">Our Menu</h1>
            <p className="text-xs text-on-surface-variant/60 text-center">Curated by our chef</p>
          </div>
          <button onClick={() => navigate(`/customer/${tableId}/cart`)} className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all">
            <span className="material-symbols-outlined">shopping_cart</span>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-on-primary text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 category-scroll mb-6">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 text-sm font-medium ${
                activeCategory === cat.id ? "bg-primary/20 border border-primary/40 text-primary shadow-[0_0_12px_rgba(255,193,116,0.1)]" : "bg-white/5 border border-white/10 text-on-surface-variant hover:bg-white/10 hover:text-white"
              }`}>
              <span className="material-symbols-outlined text-lg">{cat.icon}</span><span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="rounded-2xl p-5 flex flex-col group transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px 0 rgba(0,0,0,0.37)" }}>
              <div className="w-full h-36 bg-gradient-to-br from-surface-container-high to-surface-container rounded-xl flex items-center justify-center mb-4 text-5xl relative overflow-hidden">
                {item.image}
                {item.popular && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary/80 text-on-primary text-[10px] font-bold flex items-center gap-1"><span className="material-symbols-outlined text-xs">star</span>Popular</span>}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">{item.name}</h3>
                <p className="text-on-surface-variant/70 text-sm mb-3 line-clamp-2">{item.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <span className="font-mono text-primary font-bold text-lg">{formatPrice(item.price)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setNoteItem(item.id)} className="flex items-center gap-1.5 px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant hover:text-white active:scale-95 transition-all text-sm" title="Add note">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                  </button>
                  <button onClick={() => addToCart(item)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 active:scale-95 transition-all text-sm font-semibold">
                    <span className="material-symbols-outlined text-lg">add</span>Add
                  </button>
                </div>
              </div>
              {/* Note Input */}
              {noteItem === item.id && (
                <div className="mt-3 pt-3 border-t border-white/5 animate-[slideDown_0.2s_ease]">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Special request..."
                      className="flex-1 px-3 py-2 rounded-xl text-xs text-on-surface placeholder-on-surface-variant/30 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onKeyDown={e => { if (e.key === "Enter") addToCart(item, e.target.value); }} autoFocus />
                    <button onClick={() => { const input = document.querySelector(`input[placeholder="Special request..."]`); addToCart(item, input?.value || ""); }}
                      className="px-3 py-2 rounded-xl text-xs font-bold active:scale-95"
                      style={{ background: "#ffc174", color: "#472a00" }}>Add</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
