import React, { useState, useEffect } from "react";
import api from "@/lib/api.js";

export default function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", description: "", categoryId: "", isAvailable: true });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/menu"), api.get("/categories")])
      .then(([menuRes, catRes]) => {
        setItems(menuRes.data);
        setCategories(catRes.data);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load menu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", categoryId: categories[0]?._id || "", isAvailable: true });
    setEditingItem(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      price: item.price,
      description: item.description || "",
      categoryId: item.categoryId?._id || item.categoryId || "",
      isAvailable: item.isAvailable !== false,
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      alert("Name, price, and category are required");
      return;
    }
    try {
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem._id}`, form);
        setItems((prev) => prev.map((i) => (i._id === editingItem._id ? res.data : i)));
      } else {
        const res = await api.post("/menu", form);
        setItems((prev) => [res.data, ...prev]);
      }
      setShowForm(false);
      fetchData(); // refresh to get populated data
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await api.delete(`/menu/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const toggleAvailable = async (item) => {
    try {
      const res = await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
      setItems((prev) => prev.map((i) => (i._id === item._id ? res.data : i)));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update");
    }
  };

  const filtered = items.filter((i) => {
    const catName = i.categoryId?.name || "";
    const mCat = activeCat === "All" || catName === activeCat;
    const mSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      catName.toLowerCase().includes(search.toLowerCase());
    return mCat && mSearch;
  });

  const catNames = ["All", ...new Set(items.map((i) => i.categoryId?.name).filter(Boolean))];
  const stats = {
    total: items.length,
    available: items.filter((i) => i.isAvailable !== false).length,
    out: items.filter((i) => i.isAvailable === false).length,
    cats: new Set(items.map((i) => i.categoryId?.name).filter(Boolean)).size,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <p className="text-error text-sm">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white">Menu Management</h1>
          <p className="text-on-surface-variant/60 text-sm mt-1">Curate your digital catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-10 pr-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/30 text-lg">search</span>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all"
            style={{ background: "#ffc174", color: "#472a00" }}
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">add</span>Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", val: stats.total, color: "#dce2f7" },
          { label: "Available", val: stats.available, color: "#56e5a9" },
          { label: "Out of Stock", val: stats.out, color: "#ffb4ab" },
          { label: "Categories", val: stats.cats, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-on-surface-variant/40 text-[11px] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {catNames.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeCat === cat ? "text-primary" : "text-on-surface-variant/50 hover:bg-white/5 hover:text-on-surface-variant"}`}
            style={activeCat === cat ? { background: "rgba(255,193,116,0.1)", border: "1px solid rgba(255,193,116,0.3)" } : { border: "1px solid transparent" }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">restaurant_menu</span>
          <p className="text-on-surface-variant/40 text-sm">No menu items found.</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
            Add your first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{
                backdropFilter: "blur(16px)",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${item.isAvailable !== false ? "rgba(86,229,169,0.15)" : "rgba(255,180,171,0.2)"}`,
              }}
            >
              {item.image && (
                <div className="h-40 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
                    <span className="text-on-surface-variant/40 text-xs">{item.categoryId?.name || ""}</span>
                  </div>
                  <span className="text-primary font-mono font-bold text-lg ml-2">${item.price}</span>
                </div>
                {item.description && (
                  <p className="text-on-surface-variant/60 text-xs line-clamp-2 mb-3">{item.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailable(item)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${item.isAvailable !== false ? "bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20" : "bg-error/10 text-error border border-error/20 hover:bg-error/20"}`}
                  >
                    {item.isAvailable !== false ? "Available" : "Out of Stock"}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant/60 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant/60 hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div
            className="rounded-3xl p-6 w-full max-w-lg"
            style={{ backdropFilter: "blur(32px)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</h2>
              <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Item Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter dish name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Price ($)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div>
                <label className="block text-on-surface-variant/60 text-[11px] font-semibold uppercase tracking-wider mb-2">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-[#1a2333]">{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-white/5 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all"
                  style={{ background: "#ffc174", color: "#472a00" }}
                >
                  {editingItem ? "Update" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
