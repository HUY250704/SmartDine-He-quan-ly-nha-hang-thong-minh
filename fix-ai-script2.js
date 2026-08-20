const fs = require('fs');
const filePath = '.\\backend\\src\\services\\aiService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Update callGemini to add retry delay for 429 errors
content = content.replace(
  "if (res.status === 429 || res.status === 503) {\n        lastErr = new Error(\`Gemini \${model} quota/rate-limit (\${res.status})\`);\n        continue;",
  "if (res.status === 429 || res.status === 503) {\n        const retryAfter = res.headers.get('Retry-After');\n        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;\n        lastErr = new AiServiceError('ai_quota_exceeded', \`Gemini \${model} quota/rate-limit (\${res.status})\`, { status: 429 });\n        lastErr.retryDelay = delay;\n        if (model === models[models.length - 1]) break;\n        continue;"
);

// Update callOpenRouter to handle quota errors better
content = content.replace(
  "const response = await client.chat.completions.create({\n    model: getOpenRouterModel(),\n    messages: [{ role: 'user', content: prompt }],\n  });\n  const text = response.choices?.[0]?.message?.content;",
  "let response;\n  try {\n    response = await client.chat.completions.create({\n      model: getOpenRouterModel(),\n      messages: [{ role: 'user', content: prompt }],\n    });\n  } catch (apiError) {\n    if (apiError.status === 429 || apiError.status === 503) {\n      throw new AiServiceError('ai_quota_exceeded', 'OpenRouter rate limit exceeded', { status: 429 });\n    }\n    throw apiError;\n  }\n  const text = response.choices?.[0]?.message?.content;"
);

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
