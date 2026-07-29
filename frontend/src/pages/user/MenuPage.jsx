import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";

const CATEGORY_ICONS = {
  appetizer: "tapas",
  main: "dinner_dining",
  dessert: "cake",
  drinks: "local_bar",
  beverage: "local_cafe",
  soup: "soup_kitchen",
  salad: "eco",
  seafood: "set_meal",
  grill: "outdoor_grill",
  special: "star",
};

export default function MenuPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showToast, setShowToast] = useState(null);

  const formatPrice = (p) => {
    const vnd = typeof p === "number" ? p * 25000 : p;
    return vnd.toLocaleString("vi-VN") + "\u0111";
  };

  useEffect(() => {
    Promise.all([
      api.get("/menu"),
      api.get("/categories"),
    ])
      .then(([menuRes, catRes]) => {
        setMenuItems(menuRes.data);
        const cats = catRes.data || [];
        setCategories([
          { _id: "all", name: t("menu.allItems") || "All", icon: "apps" },
          ...cats.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.name?.toLowerCase()] || "category" })),
        ]);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load menu");
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = (item) => {
    addToCart(item);
    setShowToast(item.name);
    setTimeout(() => setShowToast(null), 2000);
  };

  const filtered = menuItems
    .filter((i) => {
      if (activeCategory !== "all" && i.categoryId?._id !== activeCategory) return false;
      if (search && !i.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24 relative">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-bold animate-[slideDown_0.3s_ease]" style={{ background: "rgba(86,229,169,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(86,229,169,0.3)", color: "#56e5a9" }}>
          Added "{showToast}" to cart
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">{t("user.backToMenu")}</span>
          </button>
          <h1 className="text-lg font-bold text-white">{t("user.menu")}</h1>
          <button onClick={() => navigate(`/customer/${tableId}/cart`)} className="relative">
            <span className="material-symbols-outlined text-xl text-primary">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="material-symbols-outlined text-on-surface-variant/50 text-lg">search</span>
            <input
              type="text"
              placeholder={t("menu.searchMenu") || "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/30 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <span className="material-symbols-outlined text-on-surface-variant/50 text-sm">close</span>
              </button>
            )}
          </div>
        </div>
        {/* Category tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat._id ? "bg-primary/20 text-primary border border-primary/30" : "text-on-surface-variant hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon || "category"}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Items */}
      <div className="max-w-lg mx-auto px-4 py-6 grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant/40 text-sm">No items found</div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl p-4 flex gap-4 group transition-all hover:scale-[1.01]"
              style={{ backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-4xl flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">restaurant</span>
                )}
                {item.popular && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-bold">TOP</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold">{item.name}</h3>
                <p className="text-on-surface-variant/60 text-xs mt-0.5 line-clamp-2">{item.description || item.aiDescription || ""}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-primary font-mono font-bold">{formatPrice(item.price)}</span>
                  <button
                    onClick={() => addItem(item)}
                    disabled={!item.isAvailable}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all ${
                      item.isAvailable !== false ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-white/5 text-on-surface-variant/30 cursor-not-allowed"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <UserBottomNav tableId={tableId} />
    </div>
  );
}
