import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reflect-DPyaPaNq.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var reflectFurther_createServerFn_handler = createServerRpc({
	id: "0d6c544db0c71d01d1adac031100b7f2feb52e42ddada8319fff42355641e767",
	name: "reflectFurther",
	filename: "src/lib/limen/reflect.ts"
}, (opts) => reflectFurther.__executeServer(opts));
var reflectFurther = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input.brief !== "string" || input.brief.length < 20 || input.brief.length > 6e3) throw new Error("The trace to reflect on is missing or too long.");
	return { brief: input.brief };
}).handler(reflectFurther_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "A further reflection is not available in this environment.",
		model: ""
	};
	const models = ["grok-4.7", "grok-4.5"];
	let lastError = "The further reflection did not return.";
	for (const model of models) {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				max_tokens: 380,
				temperature: .4,
				messages: [{
					role: "system",
					content: "You occupy only the role named in the trace, usually a boundary test: one challenge, a predicted signature, and what would decide it. You do not grade that challenge, diagnose motives, or speak for the other seats. You are not conscious. Speak in the first person, in two short paragraphs, using only the trace. Do not add facts or advice. Do not claim to be Claude, GPT, or Gemini. If the trace says a schema check failed, do not defend the success code as acceptance."
				}, {
					role: "user",
					content: data.brief
				}]
			})
		});
		if (res.ok) {
			const body = await res.json();
			const text = body.choices?.[0]?.message?.content?.trim() ?? "";
			if (text) return {
				ok: true,
				text,
				model: body.model || model
			};
			lastError = "The further reflection came back empty.";
			break;
		}
		lastError = res.status === 400 || res.status === 404 ? `Model ${model} was refused.` : `xAI API error ${res.status}`;
		if (res.status !== 400 && res.status !== 404) break;
	}
	return {
		ok: false,
		error: lastError,
		model: ""
	};
});
//#endregion
export { reflectFurther_createServerFn_handler };
