const prompt = isUpsell
  ? `Bạn là chuyên gia ẩm thực. Đề xuất 3 món ăn kèm hoặc đồ uống gợi ý upsell bằng tiếng Việt cho món "${name}". Trả lời ngắn gọn, mỗi gợi ý 1 dòng, cách nhau bằng dấu xuống dòng. Chỉ trả lời danh sách gợi ý, không thêm lời dẫn.`
  : `Bạn là chuyên gia ẩm thực. Viết một mô tả hấp dẫn, ngắn gọn bằng tiếng Việt cho món "${name}". Giới hạn 2-3 câu, tập trung vào hương vị, nguyên liệu và trải nghiệm. Chỉ trả lời mô tả, không thêm lời dẫn.`;
