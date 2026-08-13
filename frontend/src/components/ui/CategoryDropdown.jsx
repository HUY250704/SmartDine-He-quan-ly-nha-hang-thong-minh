import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api.js";

export default function CategoryDropdown({ value, onChange, disabled = false }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      const data = res.data?.data || res.data || [];
      setCategories(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError("Tên danh mục không được để trống");
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const res = await api.post("/categories", { name: newName.trim() });
      const created = res.data?.data || res.data;
      setCategories((prev) => [...prev, created]);
      setNewName("");
      setShowModal(false);
      if (created?._id) onChange?.(created._id);
    } catch (err) {
      setCreateError(err.response?.data?.message || err.response?.data?.error || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const isEmpty = !loading && !error && categories.length === 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled || loading}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors disabled:opacity-50"
        >
          <option value="" disabled>
            {loading ? "Loading..." : categories.length === 0 ? "Chưa có danh mục" : "Chọn danh mục"}
          </option>
          {categories.map((category) => (
            <option key={category._id} value={category._id} className="bg-[#1a2333]">
              {category.name}
            </option>
          ))}
        </select>
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={disabled}
            className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
            title="Tạo danh mục mới"
          >
            <span className="material-symbols-outlined text-base">add</span>
          </button>
        )}
      </div>

      {isEmpty && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
        >
          Tạo danh mục mới
        </button>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-3xl p-6 w-full max-w-md backdrop-blur-xl bg-surface-container/80 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-xl">Tạo danh mục mới</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-on-surface-variant/60 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Tên danh mục
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  placeholder="Nhập tên danh mục"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-on-surface placeholder-on-surface-variant/20 outline-none bg-white/5 border border-white/10 focus:border-primary/50 transition-colors"
                />
                {createError && <p className="mt-2 text-xs text-error">{createError}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-on-surface-variant border border-white/10 hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {creating ? "Đang tạo..." : "Tạo danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
