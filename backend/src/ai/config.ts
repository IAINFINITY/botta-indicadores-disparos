const DEFAULT_MODEL_NAME = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_MAX_OUTPUT_TOKENS = 350;

export interface AiRuntimeConfig {
  modelName: string;
  temperature: number;
  maxOutputTokens: number;
}

export function getAiConfig(): AiRuntimeConfig {
  const temperature = Number(process.env.TEMPERATURE ?? DEFAULT_TEMPERATURE);
  const maxOutputTokens = Number(process.env.MAX_OUTPUT_TOKENS ?? DEFAULT_MAX_OUTPUT_TOKENS);

  return {
    modelName: String(process.env.MODEL_NAME || DEFAULT_MODEL_NAME),
    temperature: Number.isFinite(temperature) ? temperature : DEFAULT_TEMPERATURE,
    maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : DEFAULT_MAX_OUTPUT_TOKENS,
  };
}

