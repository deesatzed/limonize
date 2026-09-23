import { createServerFn } from "@tanstack/react-start";

export const reflectFurther = createServerFn({ method: "POST" })
  .validator((input: { brief: string }) => {
    if (!input || typeof input.brief !== "string" || input.brief.length < 20 || input.brief.length > 6000) {
      throw new Error("The trace to reflect on is missing or too long.");
    }
    return { brief: input.brief };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "A further reflection is not available in this environment.", model: "" };

    const models = ["grok-4.7", "grok-4.5"];
    let lastError = "The further reflection did not return.";
    for (const model of models) {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 380,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You occupy only the role named in the trace, usually a boundary test: one challenge, a predicted signature, and what would decide it. You do not grade that challenge, diagnose motives, or speak for the other seats. You are not conscious. Speak in the first person, in two short paragraphs, using only the trace. Do not add facts or advice. Do not claim to be Claude, GPT, or Gemini. If the trace says a schema check failed, do not defend the success code as acceptance.",
            },
            { role: "user", content: data.brief },
          ],
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { choices?: { message?: { content?: string } }[]; model?: string };
        const text = body.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) return { ok: true as const, text, model: body.model || model };
        lastError = "The further reflection came back empty.";
        break;
      }
      lastError = res.status === 400 || res.status === 404 ? `Model ${model} was refused.` : `xAI API error ${res.status}`;
      if (res.status !== 400 && res.status !== 404) break;
    }
    return { ok: false as const, error: lastError, model: "" };
  });
