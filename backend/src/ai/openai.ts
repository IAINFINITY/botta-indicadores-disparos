interface OpenAiChatCompletionChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenAiChatCompletionResponse {
  choices?: OpenAiChatCompletionChoice[];
}

interface GenerateAnalysisInput {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export async function generateChatCompletion(input: GenerateAnalysisInput): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: input.systemPrompt,
        },
        {
          role: "user",
          content: input.userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body || "Resposta vazia."}`);
  }

  const payload = (await response.json()) as OpenAiChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI não retornou conteúdo de análise.");
  }

  return content;
}

