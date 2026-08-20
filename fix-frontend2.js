const fs = require('fs');
const filePath = '.\\frontend\\src\\pages\\admin\\MenuManagementPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Simple string replacement for handleGenerateUpsell
const oldUpsellPattern = `
  const handleGenerateUpsell = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Please enter a dish name first"); return; }
    setUpsellGenerating(true);
    setAiError("");
    try {
      const response = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "upsell" });
      const data = response.data?.data || response.data;
      setForm(prev => ({ ...prev, upsellSuggestion: data.upsellSuggestion }));
    } catch (err) {
      setAiError(err.response?.data?.error || err.message || "Failed to generate upsell suggestions");
    } finally {
      setUpsellGenerating(false);
    }
  };`;

const newUpsellPattern = `
  const handleGenerateUpsell = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Vui l?ng nh?p tên món ãn"); return; }
    setUpsellGenerating(true);
    setAiError("");
    try {
      const response = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "upsell" });
      const data = response.data?.data || response.data;
      setForm(prev => ({ ...prev, upsellSuggestion: data.upsellSuggestion }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Không th? t?o g?i ? bán thêm. Vui l?ng th? l?i sau.";
      setAiError(errorMsg);
    } finally {
      setUpsellGenerating(false);
    }
  };`;

content = content.replace(oldUpsellPattern, newUpsellPattern);

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
