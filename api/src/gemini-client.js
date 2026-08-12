import fetch from 'node-fetch';

/**
 * Cliente para Google Gemini API
 * Usado para generación de texto autónomo
 */
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * Llamar a la API de Gemini
 * @param {string} prompt - El prompt a enviar
 * @param {Object} [options] - Opciones adicionales
 * @param {string} [options.model='gemini-1.5-flash-latest'] - Modelo a usar
 * @param {number} [options.temperature=0.9] - Temperatura (0-1)
 * @param {number} [options.maxOutputTokens=2048] - Tokens máximos de salida
 * @returns {Promise<string>} - Respuesta de Gemini
 */
export async function callGemini(prompt, options = {}) {
  const {
    model = 'gemini-1.5-flash-latest',
    temperature = 0.9,
    maxOutputTokens = 2048,
  } = options;

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('❌ GEMINI_API_KEY no está configurado');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
      topK: 64,
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  };

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en Gemini API: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No se generaron candidatos');
    }

    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    console.error('❌ Error en callGemini:', error.message);
    throw error;
  }
}

/**
 * Generar texto con Gemini (alternativa con manejo de errores)
 * @param {string} prompt - El prompt
 * @param {Object} [options] - Opciones
 * @returns {Promise<string>} - Respuesta o mensaje de error
 */
export async function safeCallGemini(prompt, options = {}) {
  try {
    return await callGemini(prompt, options);
  } catch (error) {
    console.error('⚠️ Fallback de Gemini:', error.message);
    // Retornar una respuesta por defecto
    return 'Lo siento, no pude generar una respuesta en este momento.';
  }
}

/**
 * Generar acción autónoma específica
 * @param {string} context - Contexto de la acción
 * @returns {Promise<Object>} - Acción en formato JSON
 */
export async function generateAutonomousAction(context) {
  const prompt = `Eres HECTRON, un sistema autónomo. ${context}
  Genera una acción en JSON: {"type": "...", "value": "..."}. Solo JSON, nada más.`;

  const response = await safeCallGemini(prompt, { temperature: 0.7 });
  
  try {
    // Intentar parsear el JSON
    const match = response.match(/{[sS]*}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('No se encontró JSON en la respuesta');
  } catch {
    // Retornar acción por defecto
    return { type: 'emotion', value: 'NEUTRAL' };
  }
}