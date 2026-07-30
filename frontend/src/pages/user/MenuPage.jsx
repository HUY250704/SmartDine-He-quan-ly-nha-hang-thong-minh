import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import { UserBottomNav } from "@/components/layout/UserBottomNav";
import api from "@/lib/api.js";
import { formatVND } from "@/lib/price.js";

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

  useEffect(() => {
    Promise.all([api.get("/menu"), api.get("/categories")])
      .then(([menuRes, catRes]) => {
        setMenuItems(menuRes.data);
        const cats = catRes.data || [];
        setCategories([
          { _id: "all", name: t("menu.allItems") || "All", icon: "apps" },
          ...cats.map((c) => ({
            ...c,
            icon: CATEGORY_ICONS[c.name?.toLowerCase()] || "category",
          })),
        ]);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load menu");
      })
      .finally(() => setLoading(false));
  }, []);

  const addItem = (item, e) => {
    e?.stopPropagation();
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1322] text-on-surface pb-24 relative">
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-bold animate-[slideDown_0.3s_ease]"
          style={{
            background: "rgba(86,229,169,0.15)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(86,229,169,0.3)",
            color: "#56e5a9",
          }}
        >
          Added "{showToast}" to cart
        </div>
      )}

      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>table_restaurant</span>
              <span className="text-xs font-bold text-white">
                {t("user.yourTable")}: <span style={{ color: "#ffc174" }}>#{tableId}</span>
              </span>
            </div>
          </div>
          <button onClick={() => navigate(`/customer/${tableId}/cart`)} className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-xl text-primary">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto category-scroll">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat._id
                  ? "bg-primary/15 text-primary border border-primary/40 shadow-lg shadow-primary/10"
                  : "text-on-surface-variant hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon || "category"}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Search */}
      <div className="max-w-lg mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)" }}>
          <span className="material-symbols-outlined text-on-surface-variant/40 text-xl">search</span>
          <input
            type="text"
            placeholder="Find your favorite dish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant/30 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant/50 text-sm">close</span>
            </button>
          )}
          <span className="material-symbols-outlined text-primary/40">restaurant_menu</span>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-lg mx-auto px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/10 mb-4">search_off</span>
            <p className="text-on-surface-variant/40 text-sm">No items found</p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-xs text-primary hover:underline">
                Clear search
              </button>
            )}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              className="glass-card rounded-2xl p-4 flex flex-col transition-all duration-300"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "inset 1px 1px 0px rgba(255,255,255,0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,193,116,0.3)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-white/5 flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">restaurant</span>
                  </div>
                )}
                {item.popular && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(255,193,116,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    POPULAR
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col">
                <h3 className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">{item.name}</h3>
                <p className="text-on-surface-variant/50 text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
                  {item.description || item.aiDescription || ""}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>
                    {formatVND(item.price)}
                  </span>
                  <button
                    onClick={(e) => addItem(item, e)}
                    disabled={item.isAvailable === false}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90"
                    style={{
                      background: item.isAvailable !== false ? "rgba(255,193,116,0.15)" : "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(12px)",
                      border: item.isAvailable !== false ? "1px solid rgba(255,193,116,0.3)" : "1px solid rgba(255,255,255,0.05)",
                      color: item.isAvailable !== false ? "#ffc174" : "rgba(216,195,173,0.3)",
                      cursor: item.isAvailable !== false ? "pointer" : "not-allowed",
                    }}
                  >
                    <span className="material-symbols-outlined text-lg">{item.isAvailable !== false ? "add" : "close"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB Cart */}
      {cartCount > 0 && (
        <button
          id="cart-fab"
          onClick={() => navigate(`/customer/${tableId}/cart`)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20"
          style={{
            background: "rgba(255,193,116,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,193,116,0.4)",
            boxShadow: "0 0 20px rgba(255,193,116,0.2)",
          }}
        >
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-tertiary text-on-tertiary text-[11px] font-bold flex items-center justify-center border-2 border-[#0c1322]">
            {cartCount}
          </span>
        </button>
      )}

      <UserBottomNav tableId={tableId} />
    </div>
  );
}


