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

/**
 * Gửi một prompt, trả về text từ AI.
 * Interface giữ nguyên so với geminiService.generateContent().
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateContent(prompt) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [{ role: 'user', content: prompt }],
  });
  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error('Không nhận được phản hồi từ AI.');
  return text.trim();
}

/**
 * Trả về trạng thái service hiện tại (dùng cho debug/monitoring).
 * @returns {{ provider: string, model: string, configured: boolean }}
 */
export function getServiceStatus() {
  return {
    provider: 'openrouter',
    model: getModel(),
    configured: !!process.env.OPENROUTER_API_KEY,
  };
}
