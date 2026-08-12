import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";
import { getDishImage } from "@/lib/dishImages.js";
import { formatVND } from "@/lib/price.js";
export default function MenuManagementPage() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [availFilter, setAvailFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", categoryId: "", isAvailable: true, image: "", aiDescription: "", upsellSuggestion: "" });
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [upsellGenerating, setUpsellGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/menu"), api.get("/categories")])
      .then(([menuRes, catRes]) => { setItems(menuRes.data); setCategories(catRes.data); })
      .catch((err) => setError(err.response?.data?.error || "Failed to load menu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", categoryId: categories[0]?._id || "", isAvailable: true, image: "", aiDescription: "", upsellSuggestion: "" });
    setImagePreview(null);
    setEditingItem(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name, price: item.price, description: item.description || "", categoryId: item.categoryId?._id || item.categoryId || "", isAvailable: item.isAvailable !== false, image: item.image || "", aiDescription: item.aiDescription || "", upsellSuggestion: item.upsellSuggestion || "" });
    setImagePreview(item.image || null);
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/menu/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, image: data.url }));
      setImagePreview(data.url);
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
      setImagePreview(form.image || null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) { alert(t("menu.nameRequired")); return; }
    try {
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem._id}`, { ...form, image: form.image || "" });
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.data : i)));
      } else {
        const res = await api.post("/menu", { ...form, image: form.image || "" });
        setItems((prev) => [res.data, ...prev]);
      }
      setShowForm(false);
      fetchData();
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

  const handleGenerateAI = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Please enter a dish name first"); return; }
    setAiGenerating(true);
    setAiError("");
    try {
      const { data } = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "description" });
      setForm(prev => ({ ...prev, aiDescription: data.aiDescription }));
    } catch (err) {
      setAiError(err.response?.data?.error || err.message || "Failed to generate AI description");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateUpsell = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Please enter a dish name first"); return; }
    setUpsellGenerating(true);
    setAiError("");
    try {
      const { data } = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "upsell" });
      setForm(prev => ({ ...prev, upsellSuggestion: data.upsellSuggestion }));
    } catch (err) {
      setAiError(err.response?.data?.error || err.message || "Failed to generate upsell suggestions");
    } finally {
      setUpsellGenerating(false);
    }
  };

  const filtered = items.filter((i) => {
    const catName = i.categoryId?.name || "";
    const mCat = activeCat === "All" || catName === activeCat;
    const mSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || catName.toLowerCase().includes(search.toLowerCase());
    const mAvail = availFilter === "All" || (availFilter === "available" && i.isAvailable !== false) || (availFilter === "soldout" && i.isAvailable === false);
    return mCat && mSearch && mAvail;
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
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant outline-none text-on-surface" placeholder={t("menu.searchMenu")} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-primary/20 text-primary border border-primary/30 font-semibold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>{t("menu.addItem")}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {catNames.map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeCat === cat ? "text-primary bg-primary/10 border border-primary/30" : "text-on-surface-variant/50 hover:bg-white/5"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider mr-1">Trang thai:</span>
        {[
          { key: "All", label: "Tat ca" },
          { key: "available", label: "Con hang", color: "#56e5a9" },
          { key: "soldout", label: "Het hang", color: "#ffb4ab" },
        ].map((f) => (
          <button key={f.key} onClick={() => setAvailFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              availFilter === f.key
                ? "border"
                : "text-on-surface-variant/40 hover:text-on-surface-variant/70"
            }`}
            style={availFilter === f.key ? { background: f.color + "15", borderColor: f.color + "40", color: f.color } : {}}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4">restaurant_menu</span>
          <p className="text-on-surface-variant/40 text-sm mb-4">{t("menu.createNewEntry")}</p>
          <p className="text-xs text-on-surface-variant/50 text-center mt-2 px-10">{t("menu.createNewEntryDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((item) => {
            const isAvailable = item.isAvailable !== false;
            return (
              <GlassCard key={item._id} className="rounded-2xl overflow-hidden group cursor-pointer transition-all hover:shadow-xl" onClick={() => openEdit(item)}>
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={item.image || getDishImage(item.name)} alt={item.name} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isAvailable ? "grayscale" : ""}`} />
                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAvailable ? "bg-primary/20 text-primary border border-primary/30" : "bg-error/20 text-error border border-error/30"}`}>
                    {isAvailable ? t("menu.available") : t("menu.soldOut")}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-1">{item.name}</h3>
                  <p className="text-on-surface-variant/50 text-xs mb-3">{item.categoryId?.name || t("menu.uncategorized")}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm" style={{ color: "#ffc174" }}>{formatVND(item.price)}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleAvailable(item)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAvailable ? "bg-primary/20 text-primary" : "bg-error/20 text-error"}`}>
                        <span className="material-symbols-outlined text-sm">{isAvailable ? "visibility" : "visibility_off"}</span>
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="w-8 h-8 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition-all">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <button onClick={openCreate} className="md:hidden fixed right-6 bottom-20 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"><span className="material-symbols-outlined">add</span></button>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <GlassCard className="rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">{editingItem ? t("menu.editMenuItem") : t("menu.addNewItem")}</h2>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-white transition-colors">
                <span className="material-symbols-outlined">{t("common.close")}</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.itemName")}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter dish name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.price")}</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.category")}</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors">
                    {categories.map((c) => (<option key={c._id} value={c._id} className="bg-[#1a2333]">{c.name}</option>))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">Image</label>

                {/* Preview */}
                {imagePreview && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-white/5 border border-white/10">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      onClick={() => { setImagePreview(null); setForm({ ...form, image: "" }); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-white text-xs">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Area */}
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${imagePreview ? "border-white/5 py-3" : "border-white/10 py-6 hover:border-primary/30 hover:bg-primary/5"}`}
                >
                  {!imagePreview ? (
                    <>
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl">cloud_upload</span>
                      <span className="text-on-surface-variant/40 text-xs">Click to upload image</span>
                      <span className="text-on-surface-variant/20 text-[10px]">JPG, PNG, GIF, WebP Ä‚â€Ă‚Â· Max 5MB</span>
                    </>
                  ) : (
                    <span className="text-on-surface-variant/40 text-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">swap_horiz</span>
                      Change image
                    </span>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">{t("menu.description")}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
              </div>

              {/* AI Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider">AI Description</label>
                  <button type="button" onClick={handleGenerateAI} disabled={aiGenerating || !form.name.trim()}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff" }}>
                    {aiGenerating ? (<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin inline-block" />Generating...</span>) : (<><span className="material-symbols-outlined text-xs align-middle">auto_awesome</span> Generate AI</>)}
                  </button>
                </div>
                <textarea value={form.aiDescription} onChange={(e) => setForm({ ...form, aiDescription: e.target.value })} placeholder="AI-generated description will appear here..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
              </div>

              {/* Upsell Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider">Upsell Suggestions</label>
                  <button type="button" onClick={handleGenerateUpsell} disabled={upsellGenerating || !form.name.trim()}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #ec6a06, #f97316)", color: "#fff" }}>
                    {upsellGenerating ? (<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin inline-block" />Generating...</span>) : (<><span className="material-symbols-outlined text-xs align-middle">tips_and_updates</span> Upsell</>)}
                  </button>
                </div>
                <textarea value={form.upsellSuggestion} onChange={(e) => setForm({ ...form, upsellSuggestion: e.target.value })} placeholder="AI-generated upsell suggestions will appear here..." rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors" />
              </div>

              {/* AI Error */}
              {aiError && (
                <div className="px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(255,180,171,0.1)", border: "1px solid rgba(255,180,171,0.3)", color: "#ffb4ab" }}>
                  {aiError}
                </div>
              )}

              {/* Available Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="sr-only" />
                  <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${form.isAvailable ? "bg-primary" : "bg-white/10"}`} />
                  <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 shadow-sm ${form.isAvailable ? "translate-x-full" : ""}`} />
                </label>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tight">{form.isAvailable ? t("menu.available") : t("menu.unavailable")}</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10 hover:bg-white/5 transition-colors">
                  {t("common.cancel")}
                </button>
                <button onClick={handleSave} disabled={uploading}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  {editingItem ? t("menu.update") : t("menu.publish")}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
