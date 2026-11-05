import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const nvidiaProvider = createOpenAICompatible({
  name: "nvidia",
  baseURL:
    process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

export const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3.5-super-vl-120b-a12b";

export function requireNvidiaKey(): void {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error(
      "NVIDIA_API_KEY no está definida. Configúrela en el entorno antes de usar el chat."
    );
  }
}
