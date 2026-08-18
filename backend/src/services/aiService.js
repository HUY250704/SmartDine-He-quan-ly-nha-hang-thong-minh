import OpenAI from 'openai';

let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY chưa được cấu hình.');
  _client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
  return _client;
}

function getModel() {
  return process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free';
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Gửi một prompt, trả về text từ AI.
 * Tự động retry khi gặp lỗi429 (rate limit).
 */
export async function generateContent(prompt) {
  const client = getClient();
  const maxRetries =3;
  let lastError = null;

  for (let attempt =1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: getModel(),
        messages: [{ role: 'user', content: prompt }],
      });
      const text = response.choices?.[0]?.message?.content;
      if (!text) throw new Error('Không nhận được phản hồi từ AI.');
      return text.trim();
    } catch (error) {
      lastError = error;
      const status = error.status || error.statusCode;

      if (status ===429 && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt),10000);
        console.warn(`[AI] Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      if (status ===429) {
        throw new Error('Tất cả API key đang bị giới hạn quota. Thử lại sau30s.');
      }

      throw error;
    }
  }

  throw lastError || new Error('AI request failed');
}

/**
 * Trả về trạng thái service hiện tại.
 */
export function getServiceStatus() {
  return {
    provider: 'openrouter',
    model: getModel(),
    configured: !!process.env.OPENROUTER_API_KEY,
  };
}
