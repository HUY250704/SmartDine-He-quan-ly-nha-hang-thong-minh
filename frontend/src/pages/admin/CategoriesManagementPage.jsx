import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api.js";
import { GlassCard } from "@/components/ui/glass-card.jsx";
import { useLang } from "@/context/LanguageContext.jsx";

export default function CategoriesManagementPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/categories"), api.get("/menu")])
      .then(([catRes, menuRes]) => {
        setCategories(catRes.data?.data || catRes.data || []);
        setMenuItems(menuRes.data?.data || menuRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.message || err.response?.data?.error || "Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const counts = useMemo(() => {
    const result = {};
    menuItems.forEach((item) => {
      const id = item.categoryId?._id || item.categoryId;
      if (id) result[id] = (result[id] || 0) + 1;
    });
    return result;
  }, [menuItems]);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditingCategory(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name || "", description: category.description || "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      alert(t("categories.nameRequired"));
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        const res = await api.put(`/categories/${editingCategory._id}`, {
          name,
          description: form.description,
        });
        const updated = res.data?.data || res.data;
        setCategories((prev) => prev.map((item) => (item._id === editingCategory._id ? updated : item)));
      } else {
        const res = await api.post("/categories", {
          name,
          description: form.description,
        });
        const created = res.data?.data || res.data;
        setCategories((prev) => [...prev, created]);
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(t("categories.deleteConfirm"))) return;
    try {
      await api.delete(`/categories/${category._id}`);
      setCategories((prev) => prev.filter((item) => item._id !== category._id));
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to delete category");
    }
  };

  const filtered = categories.filter((category) => {
    const query = search.toLowerCase();
    return (
      !query ||
      category.name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant/60 text-sm">{t("common.loading")}</p>
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
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary/20 text-primary border border-primary/30"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.01em] text-white mb-1">{t("categories.title")}</h1>
          <p className="text-on-surface-variant text-sm">{t("categories.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-full flex items-center px-4 py-2 gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 placeholder:text-on-surface-variant outline-none text-on-surface"
              placeholder={t("common.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-3 rounded-xl bg-primary/20 text-primary border border-primary/30 font-semibold text-sm hover:bg-primary/30 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t("categories.addCategory")}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4">category</span>
          <p className="text-on-surface-variant/40 text-sm mb-4">{t("categories.noCategories")}</p>
          <p className="text-xs text-on-surface-variant/50 text-center mt-2 px-10">{t("categories.noCategoriesDesc")}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((category) => {
            const itemCount = counts[category._id] || 0;
            return (
              <GlassCard key={category._id} className="rounded-2xl overflow-hidden group transition-all hover:shadow-xl">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-2xl">category</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(category)}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                        title={t("common.edit")}
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-error/10 text-error hover:bg-error/20 transition-all"
                        title={t("common.delete")}
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1 break-words">{category.name}</h3>
                  <p className="text-on-surface-variant/60 text-sm min-h-[40px] mb-4 break-words">
                    {category.description || "?"}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs font-semibold text-on-surface-variant/50">
                      {itemCount} {t("categories.itemCount")}
                    </span>
                    <button
                      onClick={() => openEdit(category)}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      {t("common.edit")}
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <GlassCard
            className="rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">
                {editingCategory ? t("categories.editCategory") : t("categories.addNewCategory")}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">
                  {t("categories.name")}
                </label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("categories.name")}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">
                  {t("categories.description")}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t("categories.description")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none resize-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10 hover:bg-white/5 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {editingCategory ? t("common.save") : t("categories.addCategory")}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
