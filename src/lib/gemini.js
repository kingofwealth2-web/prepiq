const MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
]

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

/**
 * Call Gemini with automatic model fallback.
 * Returns { text, model } on success.
 * Throws a user-friendly Error on failure.
 */
export async function gemini(prompt, systemPrompt = null) {
  const key = import.meta.env.VITE_GEMINI_API_KEY

  if (!key) {
    throw new Error('Gemini API key is not configured. Contact support.')
  }

  let lastError = null

  for (const model of MODELS) {
    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] }
      }

      const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      // API-level error
      if (data.error) {
        const code = data.error.code
        const msg = data.error.message || ''

        // Invalid key — no point trying other models
        if (code === 400 && msg.toLowerCase().includes('api key')) {
          throw new Error('Invalid API key. Check your VITE_GEMINI_API_KEY in Vercel settings.')
        }

        // Model not available — try next
        if (code === 404 || (code === 400 && msg.toLowerCase().includes('model'))) {
          lastError = new Error(`Model ${model} not available`)
          continue
        }

        // Quota / rate limit
        if (code === 429) {
          throw new Error('AI quota reached. Please wait a minute and try again.')
        }

        // Permission denied on this model — try next
        if (code === 403) {
          lastError = new Error(`Model ${model} not permitted on this key`)
          continue
        }

        // Other API error
        throw new Error(`AI error: ${msg}`)
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        lastError = new Error(`No response from ${model}`)
        continue
      }

      return { text, model }

    } catch (err) {
      // If it's one of our thrown errors (not a network error), rethrow immediately
      if (err.message.includes('API key') || err.message.includes('quota')) {
        throw err
      }
      // Network error — try next model
      lastError = err
    }
  }

  // All models failed
  if (lastError) throw lastError
  throw new Error('Could not reach AI. Check your internet connection.')
}

/**
 * Parse JSON from a Gemini response, stripping markdown fences.
 */
export function parseJSON(text) {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  return JSON.parse(cleaned)
}