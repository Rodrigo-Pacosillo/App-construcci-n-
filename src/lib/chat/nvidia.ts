/**
 * Wrapper del cliente de NVIDIA NIM / build.nvidia.com.
 * La API es compatible con el formato OpenAI Chat Completions.
 * Base URL: https://integrate.api.nvidia.com/v1
 */

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-70b-instruct";

if (!NVIDIA_API_KEY) {
  // No lanzar aquí para evitar fallar en build sin la variable;
  // el error se manejará en el Route Handler al intentar llamar.
  console.warn("[nvidia.ts] NVIDIA_API_KEY no está definida en el entorno.");
}

export interface NvidiaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NvidiaChatOptions {
  messages: NvidiaMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/**
 * Envía un mensaje al modelo de NVIDIA y devuelve el texto de respuesta.
 * Lanza error si la API falla o no está configurada la key.
 */
export async function nvidiaChat(opts: NvidiaChatOptions): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error("NVIDIA_API_KEY no configurada");
  }

  const payload: Record<string, unknown> = {
    model: NVIDIA_MODEL,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    top_p: opts.topP ?? 1,
    stream: opts.stream ?? false,
  };

  if (opts.maxTokens) {
    payload.max_tokens = opts.maxTokens;
  }

  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `NVIDIA API error (${res.status}): ${errorText.slice(0, 200)}`
    );
  }

  const data = await res.json();

  const content =
    data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.text ??
    "";

  if (!content) {
    throw new Error("NVIDIA API devolvió una respuesta vacía");
  }

  return content;
}
