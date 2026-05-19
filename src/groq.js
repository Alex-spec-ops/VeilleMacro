/**
 * groq.js
 *
 * Thin wrapper around the Groq REST API (llama-3.3-70b-versatile).
 * Used by synthesis and dashboard agents in App.jsx when VITE_GROQ_API_KEY is defined.
 *
 * NOTE: The API key is inlined into the JS bundle by Vite.
 * For production use, proxy calls through a backend instead.
 */

const MODEL   = 'llama-3.3-70b-versatile';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * callGroq(prompt, cancellationSignal?)
 *
 * @param {string} prompt              - Full prompt to send as user message
 * @param {{ cancelled: boolean }}     - Optional cancellation signal from App
 * @returns {Promise<string>}          - Plain-text response from Groq
 * @throws {Error}                     - On HTTP error or cancellation
 */
export async function callGroq(prompt, cancellationSignal) {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) throw new Error('VITE_GROQ_API_KEY non défini dans .env');

  const abortCtrl = new AbortController();
  const cancelWatch = setInterval(() => {
    if (cancellationSignal?.cancelled) abortCtrl.abort();
  }, 100);

  try {
    const res = await fetch(API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`,
      },
      signal: abortCtrl.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature:  0.4,
        max_tokens:   2048,
        top_p:        0.9,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Groq ${res.status}: ${err.error?.message ?? res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';

  } catch (e) {
    if (e.name === 'AbortError') {
      const c = new Error('cancelled'); c.cancelled = true; throw c;
    }
    throw e;
  } finally {
    clearInterval(cancelWatch);
  }
}
