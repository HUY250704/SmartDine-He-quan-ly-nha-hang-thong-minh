import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

export default function MenuManagementPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", categoryId: "", isAvailable: true, image: "" });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/menu"), api.get("/categories")])
      .then(([menuRes, catRes]) => { setItems(menuRes.data); setCategories(catRes.data); })
      .catch((err) => setError(err.response?.data?.error || "Failed to load menu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", categoryId: categories[0]?._id || "", isAvailable: true, image: "" });
    setEditingItem(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, price: item.price, description: item.description || "", categoryId: item.categoryId?._id || item.categoryId || "", isAvailable: item.isAvailable !== false, image: item.image || "" });
    setEditingItem(item); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) { alert(t("menu.nameRequired")); return; }
    try {
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem._id}`, form);
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.data : i)));
      } else {
        const res = await api.post("/menu", form);
        setItems((prev) => [res.data, ...prev]);
      }
      setShowForm(false); fetchData();
    } catch (err) { alert(err.response?.data?.error || "Failed to save"); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("menu.deleteConfirm"))) return;
    try { await api.delete(`/menu/${id}`); setItems((prev) => prev.filter((i) => i._id !== id)); }
    catch (err) { alert(err.response?.data?.error || "Failed to delete"); }
  };

  const toggleAvailable = async (item) => {
    try {
      const res = await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
      setItems((prev) => prev.map((i) => (i._id === item._id ? res.data : i)));
    } catch (err) { alert(err.response?.data?.error || "Failed to update"); }
  };

  const filtered = items.filter((i) => {
    const catName = i.categoryId?.name || "";
    const mCat = activeCat === "All" || catName === activeCat;
    const mSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || catName.toLowerCase().includes(search.toLowerCase());
    return mCat && mSearch;
  });

  const catNames = ["All", ...new Set(items.map((i) => i.categoryId?.name).filter(Boolean))];

  if (loading) return (<div className="flex items-center justify-center h-96"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p></div></div>);
  if (error) return (<div className="flex items-center justify-center h-96"><div className="text-center"><span className="material-symbols-outlined text-4xl text-error mb-4">error</span><p className="text-error text-sm">{error}</p><button onClick={fetchData} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">{t("common.retry")}</button></div></div>);

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white mb-1">{t("menu.title")}</h1>
          <p className="text-on-surface-variant text-sm">{t("menu.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-full flex items-center px-4 py-2 gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">{t("common.search").toLowerCase() === "tìm kiếm" ? "search" : "search"}</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant outline-none text-on-surface" placeholder={t("menu.searchMenu")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="hidden md:flex glass-card rounded-lg px-4 py-2 items-center gap-2 text-sm font-semibold relative overflow-hidden text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>{t("menu.generateAI")}
          </button>
          <button className="hidden md:flex glass-card rounded-lg px-4 py-2 items-center gap-2 text-sm font-semibold relative overflow-hidden text-on-surface-variant hover:text-white transition-colors">
            <span className="material-symbols-outlined text-secondary text-lg">trending_up</span>{t("menu.upsellSuggestions")}
          </button>
          <button onClick={openCreate} className="bg-primary text-on-primary px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined">add</span><span className="hidden sm:inline">{t("menu.addItem")}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {catNames.map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${activeCat === cat ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "glass-card text-on-surface-variant hover:text-white hover:border-white/20"}`}>
            {cat === "All" ? t("menu.allItems") : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const isAvailable = item.isAvailable !== false;
          const catName = item.categoryId?.name || t("menu.uncategorized");
          return (
            <GlassCard key={item._id} className={`group rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5 ${!isAvailable ? "opacity-75" : ""}`}>
              <div className="relative h-56 w-full overflow-hidden">
                {!isAvailable && (<div className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center"><span className="bg-surface-dim/80 backdrop-blur-md px-6 py-2 rounded-lg border border-white/10 text-xs font-bold uppercase tracking-widest text-on-surface">{t("menu.soldOut")}</span></div>)}
                {item.image ? (<img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isAvailable ? "grayscale" : ""}`} />)
                  : (<div className={`w-full h-full bg-surface-container flex items-center justify-center ${!isAvailable ? "grayscale" : ""}`}><span className="material-symbols-outlined text-6xl text-on-surface-variant/20">restaurant</span></div>)}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div><span className="text-[10px] text-primary font-bold uppercase tracking-widest">{catName}</span><h3 className="text-xl font-bold text-white mt-0.5">{item.name}</h3></div>
                  <span className="font-mono text-lg font-medium text-primary">${Number(item.price).toFixed(2)}</span>
                </div>
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-5 min-h-[2.5rem]">{item.description || t("menu.noDescription")}</p>
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isAvailable} onChange={() => toggleAvailable(item)} className="sr-only" />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${isAvailable ? "bg-primary" : "bg-white/10"}`} />
                      <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${isAvailable ? "translate-x-full" : ""}`} />
                    </label>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tight">{isAvailable ? t("menu.available") : t("menu.unavailable")}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg border border-white/10 hover:border-primary/30 hover:bg-white/5 text-sm">edit</button>
                    <button onClick={() => handleDelete(item._id)} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors p-2 rounded-lg border border-white/10 hover:border-error/30 hover:bg-white/5 text-sm">delete</button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
        <div onClick={openCreate} className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 group hover:border-primary/50 transition-all cursor-pointer min-h-[420px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all"><span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary">add_circle</span></div>
          <p className="font-bold text-on-surface-variant group-hover:text-primary">{t("menu.createNewEntry")}</p>
          <p className="text-xs text-on-surface-variant/50 text-center mt-2 px-10">{t("menu.createNewEntryDesc")}</p>
        </div>
      </div>

      <button onClick={openCreate} className="md:hidden fixed right-6 bottom-20 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"><span className="material-symbols-outlined">add</span></button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-white font-bold text-xl">{editingItem ? t("menu.editMenuItem") : t("menu.addNewItem")}</h2><button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-white transition-colors"><span className="material-symbols-outlined">{t("common.close")}</span></button></div>
            <div className="space-y-4">
              <div><label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.itemName")}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter dish name" className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.price")}</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" /></div>
                <div><label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.category")}</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors">{categories.map((c) => (<option key={c._id} value={c._id} className="bg-[#1a2333]">{c.name}</option>))}</select></div>
              </div>
              <div><label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.imageURL")}</label><input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" /></div>
              <div><label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.description")}</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" /></div>
              <div className="flex items-center gap-3 pt-1"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="sr-only" /><div className={`w-10 h-5 rounded-full transition-colors duration-300 ${form.isAvailable ? "bg-primary" : "bg-white/10"}`} /><div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${form.isAvailable ? "translate-x-full" : ""}`} /></label><span className="text-xs font-bold text-on-surface-variant uppercase tracking-tight">{form.isAvailable ? t("menu.available") : t("menu.unavailable")}</span></div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10 hover:bg-white/5 transition-colors">{t("common.cancel")}</button><button onClick={handleSave} className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20">{editingItem ? t("menu.update") : t("menu.publish")}</button></div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
