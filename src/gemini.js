/**
 * gemini.js
 *
 * Thin wrapper around the Gemini REST API (gemini-2.0-flash).
 * Used by runAgent() in App.jsx when VITE_GEMINI_API_KEY is defined.
 *
 * NOTE: The API key is inlined into the JS bundle by Vite.
 * For production use, proxy calls through a backend instead.
 */

const MODEL   = 'gemini-2.0-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * callGemini(prompt, cancellationSignal?)
 *
 * @param {string} prompt              - Full prompt to send as user message
 * @param {{ cancelled: boolean }}     - Optional cancellation signal from App
 * @returns {Promise<string>}          - Plain-text response from Gemini
 * @throws {Error}                     - On HTTP error or cancellation
 */
export async function callGemini(prompt, cancellationSignal) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('VITE_GEMINI_API_KEY non défini dans .env');

  // Bridge our cancellation flag → fetch AbortController
  const abortCtrl = new AbortController();
  const cancelWatch = setInterval(() => {
    if (cancellationSignal?.cancelled) abortCtrl.abort();
  }, 100);

  try {
    const res = await fetch(`${API_URL}?key=${key}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  abortCtrl.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:      0.4,
          maxOutputTokens:  2048,
          topP:             0.9,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini ${res.status}: ${err.error?.message ?? res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  } catch (e) {
    if (e.name === 'AbortError') {
      const c = new Error('cancelled'); c.cancelled = true; throw c;
    }
    throw e;
  } finally {
    clearInterval(cancelWatch);
  }
}
