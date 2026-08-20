const fs = require('fs');
const filePath = '.\\frontend\\src\\pages\\admin\\MenuManagementPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Simple string replacement for handleGenerateAI
const oldAIPattern = `
const handleGenerateAI = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Please enter a dish name first"); return; }
    setAiGenerating(true);
    setAiError("");
    try {
      const response = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "description" });
      const data = response.data?.data || response.data;
      setForm(prev => ({ ...prev, aiDescription: data.aiDescription }));
    } catch (err) {
      setAiError(err.response?.data?.error || err.message || "Failed to generate AI description");
    } finally {
      setAiGenerating(false);
    }
  };`;

const newAIPattern = `
const handleGenerateAI = async () => {
    const name = form.name.trim();
    if (!name) { setAiError("Vui l?ng nh?p tên món ãn"); return; }
    setAiGenerating(true);
    setAiError("");
    try {
      const response = await api.post("/menu/ai-description", { name, category: categories.find(c=>c._id===form.categoryId)?.name, type: "description" });
      const data = response.data?.data || response.data;
      setForm(prev => ({ ...prev, aiDescription: data.aiDescription }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Không th? t?o mô t? AI. Vui l?ng th? l?i sau.";
      setAiError(errorMsg);
    } finally {
      setAiGenerating(false);
    }
  };`;

content = content.replace(oldAIPattern, newAIPattern);

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
