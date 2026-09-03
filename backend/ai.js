import dotenv from 'dotenv';

dotenv.config();

// Tiny AI helper — just one HTTP call, no SDK to learn.
// Works with OpenAI AND anything OpenAI-compatible (e.g. Gemini's
// OpenAI endpoint, OpenRouter). Only the .env values change, not this code.
export function aiEnabled() {
  return !!process.env.AI_API_KEY;
}

// Send one prompt, get back text. Throws a friendly Error on any failure
// (no key, provider error, timeout) so routes can reply with a clean message.
export async function askAI(prompt) {
  const key = process.env.AI_API_KEY;
  if (!key) {
    throw new Error('AI is not configured. Ask the owner to set AI_API_KEY in .env');
  }

  const base = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000); // 30s max

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`, // key stays on the server, never sent to browser
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500, // cap reply length to control cost
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const detail = data?.error?.message || `Provider error (${res.status})`;
      throw new Error(detail);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('AI returned an empty reply');
    return text;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('AI took too long, try again');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
