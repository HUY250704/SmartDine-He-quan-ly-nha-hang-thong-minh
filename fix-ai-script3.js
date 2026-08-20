const fs = require('fs');
const filePath = '.\\backend\\src\\services\\aiService.js';
let content = fs.readFileSync(filePath, 'utf8');

// Remove the sanitizePrompt function at the top
content = content.replace(
  /\n\/\*\*\n \* Sanitizes prompt input to prevent injection attacks and limit length.\n \*\/\nfunction sanitizePrompt\(prompt\) \{[\s\S]*?return prompt\.replace.*?\}\);\n\}\n\n/,
  '\n'
);

// Add sanitizePrompt function after AiServiceError class
const sanitizeFunction = `
/**
 * Sanitizes prompt input to prevent injection attacks and limit length.
 */
function sanitizePrompt(prompt) {
  if (typeof prompt !== 'string') {
    throw new AiServiceError('invalid_input', 'Prompt must be a string', { status: 400 });
  }
  // Limit prompt length to prevent abuse
  const MAX_PROMPT_LENGTH = 4000;
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new AiServiceError('prompt_too_long', 'Prompt exceeds maximum length', { status: 400 });
  }
  // Remove any null bytes and control characters
  return prompt.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
}
`;

// Insert after AiServiceError class
content = content.replace(
  "  this.status = status;\n  }\n}\n\nfunction getOpenRouterKey()",
  "  this.status = status;\n  }\n}" + sanitizeFunction + "\nfunction getOpenRouterKey()"
);

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
