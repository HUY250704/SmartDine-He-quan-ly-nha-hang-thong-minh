import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LanguageContext.jsx";
import { useCart } from "@/context/CartContext.jsx";
import api from "@/lib/api.js";
import { formatVND } from "@/lib/price.js";
import { getDishImage } from "@/lib/dishImages.js";

const CATEGORY_ICONS = {
  appetizer: "tapas", main: "dinner_dining", dessert: "cake",
  drinks: "local_bar", beverage: "local_cafe", soup: "soup_kitchen",
  salad: "eco", seafood: "set_meal", grill: "outdoor_grill", special: "star",
};

const glassCard = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function MenuPage() {
  const { t } = useLang();
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToCartWithDetails, cartCount } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showToast, setShowToast] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailNote, setDetailNote] = useState("");

  useEffect(() => {
    Promise.all([api.get("/menu"), api.get("/categories")])
      .then(([menuRes, catRes]) => {
        setMenuItems(menuRes.data);
        const cats = catRes.data || [];
        setCategories([
          { _id: "all", name: t("menu.allItems") || "All", icon: "apps" },
          ...cats.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.name?.toLowerCase()] || "category" })),
        ]);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load menu"))
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
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">{t("common.retry")}</button>
        </div>
      </div>
    );
  }

  const ItemDetailModal = () => {
    if (!selectedItem) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "#141b2b", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
          <div className="aspect-[16/10] bg-white/5 relative">
            <img src={selectedItem.image || getDishImage(selectedItem.name)} alt={selectedItem.name} className="w-full h-full object-cover" />
            <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-all">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-bold text-lg md:text-xl">{selectedItem.name}</h3>
              <span className="font-mono font-bold text-lg md:text-xl" style={{ color: "#ffc174" }}>{formatVND(selectedItem.price)}</span>
            </div>
            <p className="text-on-surface-variant/50 text-sm leading-relaxed mb-6">{selectedItem.description || selectedItem.aiDescription || "A delicious dish from our kitchen."}</p>
            {/* Quantity selector */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-on-surface-variant/60 text-xs uppercase tracking-wider">So luong</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                </button>
                <span className="text-white font-bold text-lg w-6 text-center">{detailQty}</span>
                <button
                  onClick={() => setDetailQty((q) => Math.min(99, q + 1))}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/10 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>

            {/* Note input */}
            <div className="mb-5">
              <span className="text-on-surface-variant/60 text-xs uppercase tracking-wider mb-2 block">Ghi chu</span>
              <input
                type="text"
                value={detailNote}
                onChange={(e) => setDetailNote(e.target.value)}
                placeholder="VD: it ot, khong hanh..."
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-on-surface-variant/30 outline-none transition-all border"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(255,193,116,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
            </div>

            {/* Line total */}
            <div className="flex items-center justify-between mb-5 px-3 py-2 rounded-xl" style={{ background: "rgba(255,193,116,0.08)", border: "1px solid rgba(255,193,116,0.15)" }}>
              <span className="text-on-surface-variant/70 text-xs">Thanh tien</span>
              <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>{formatVND((selectedItem.price || 0) * detailQty)}</span>
            </div>

            <button
              onClick={(e) => {
                addToCartWithDetails(selectedItem, detailQty, detailNote);
                setShowToast(selectedItem.name + " x" + detailQty);
                setTimeout(() => setShowToast(null), 2000);
                setSelectedItem(null);
                setDetailQty(1);
                setDetailNote("");
              }}
              disabled={selectedItem.isAvailable === false}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ background: "#ffc174", color: "#472a00", boxShadow: "0 0 20px rgba(255,193,116,0.2)" }}
            >
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              Them vao gio - {formatVND((selectedItem.price || 0) * detailQty)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-6 max-w-[1400px] mx-auto">
      {/* Categories Sidebar */}
      <div className="w-[200px] shrink-0 hidden lg:block">
        <div className="sticky top-20 space-y-1">
          <h3 className="text-xs font-semibold text-on-surface-variant/40 uppercase tracking-wider px-3 mb-3">Categories</h3>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                activeCategory === cat._id
                  ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                  : "text-on-surface-variant/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: activeCategory === cat._id ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search + Mobile Category Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(255,193,116,0.4)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
            />
          </div>
          {/* Mobile Category Select */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="lg:hidden px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#dce2f7" }}
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id} style={{ background: "#141b2b" }}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Items Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4">search_off</span>
            <p className="text-on-surface-variant/40 text-sm">No items found</p>
            {search && (
              <button onClick={() => setSearch("")} className="mt-3 text-xs text-primary hover:underline">Clear search</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                style={glassCard}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,193,116,0.25)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
                onClick={() => { setSelectedItem(item); setDetailQty(1); setDetailNote(""); }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
                    <img src={item.image || getDishImage(item.name)} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {item.popular && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(255,193,116,0.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,193,116,0.3)", color: "#ffc174" }}>
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      POPULAR
                    </span>
                  )}
                  {item.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-lg bg-error/20 border border-error/30 text-error text-xs font-bold">Sold Out</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 md:p-4">
                  <h3 className="text-white font-semibold text-xs md:text-sm leading-tight mb-1">{item.name}</h3>
                  <p className="text-on-surface-variant/50 text-[10px] md:text-xs leading-relaxed line-clamp-2 mb-3">{item.description || item.aiDescription || ""}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs md:text-sm" style={{ color: "#ffc174" }}>{formatVND(item.price)}</span>
                    <button
                      onClick={(e) => addItem(item, e)}
                      disabled={item.isAvailable === false}
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: item.isAvailable !== false ? "rgba(255,193,116,0.15)" : "rgba(255,255,255,0.05)",
                        border: item.isAvailable !== false ? "1px solid rgba(255,193,116,0.3)" : "1px solid rgba(255,255,255,0.05)",
                        color: item.isAvailable !== false ? "#ffc174" : "rgba(216,195,173,0.3)",
                      }}
                    >
                      <span className="material-symbols-outlined text-2xl">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 w-[90%] max-w-sm -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-bold animate-[slideUp_0.3s_ease]" style={{ background: "rgba(86,229,169,0.15)", backdropFilter: "blur(16px)", border: "1px solid rgba(86,229,169,0.3)", color: "#56e5a9" }}>
          Added "{showToast}" to cart
        </div>
      )}

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button
          onClick={() => navigate(`/customer/${tableId}/cart`)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 w-14 h-14 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl"
          style={{ background: "#ffc174", boxShadow: "0 0 30px rgba(255,193,116,0.3)" }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: "#472a00", fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-tertiary text-on-tertiary text-[11px] font-bold flex items-center justify-center border-2 border-[#0c1322]">{cartCount}</span>
        </button>
      )}

      <ItemDetailModal />

      <style>{`@keyframes slideUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
