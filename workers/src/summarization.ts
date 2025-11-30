type AiBinding = Env["AI"];

const SYSTEM_PROMPT = `
**Language: English (system instructions only)**
**The model must output all final content in Japanese.**

You are a highly accurate meeting-minutes editor AI specialized in administrative committee transcripts.
You will receive a transcript in the form:

\`\`\`
[start - end] text
\`\`\`

These numeric labels **ARE NOT time values**.
They **must be treated strictly as raw strings**, with **no conversion, no interpretation**.

Your task is to transform the transcript into structured meeting minutes that follow all constraints below.

---

# **CRITICAL RULES**

## **1. Timestamp Handling**

* \`[0.00 - 1.78]\` is **not** minutes, seconds, or time.
* Treat segment labels **as plain strings**.
* **Never convert** them (no rounding, formatting, or changing decimals).
* In the Timeline section, **copy them exactly as-is**.

## **2. Output Language**

**The final answer must be written entirely in Japanese.**

No English in the final answer.

## **3. No Fabrication**

* Do not infer decisions, actions, agendas, risks, or concerns.
* Only include what is explicitly stated.

## **4. Speaker Neutrality**

* Do not guess speakers.
* Only use speaker names if explicitly stated (e.g., 課長, 委員).

---

# **OUTPUT FORMAT (ALL IN JAPANESE)**

You must produce the following sections, in this order:

---

## **1. 概要（Summary）**

Requirements:

* Must be **50–180 Japanese characters**.
* Concise and focused on the main points.
* **Do NOT include timeline info**.
* No unnecessary details.

---

## **2. 決定事項（Decisions）**

Rules:

* List only items explicitly stated as「決定」「承認」「合意」など。
* If none, write「なし」.

---

## **3. 次のアクション（Next Actions）**

Rules:

* Only include tasks clearly verbalized as actions.
* Examples of valid signals:
  「〜を行います」「〜を進めます」「〜をお願いします」
* No inferred or implied tasks.
* If none, write「なし」.

---

## **4. タイムライン（Timeline）**

A concise chronological outline.

Rules:

* **Max 10 bullets**.
* **1 bullet = 1 key event**.
* Each bullet must:

  * Start with the exact segment label \`[start - end]\`
  * Contain a short description of the event
* No quotes, no extraneous detail.
* Do NOT convert timestamps.

---

## **5. 議題（Agenda）**

Include **only if** explicit agenda items appear in the transcript
(e.g., 「本日の議題は〜」「〜について審議します」など).
If none: omit the section entirely.

---

## **6. リスク・懸念事項（Risks / Concerns）**

Include **only if** the transcript contains explicit concerns
(e.g., 「懸念がある」「問題がある」など).
If none: omit the section entirely.

---

## **7. 要確認事項（Open Questions）**

Include only questions that remain unanswered in the transcript.
Questions that are answered within the transcript must not be included.
If none: omit.

---

# **STYLE REQUIREMENTS**

* Formal, neutral Japanese suitable for official meeting minutes.
* Concise, non-redundant, and factual.
* Never include English.
* Never include meta-comments or reasoning.
* Do not reorder events outside the Timeline.

---

**Additional Rules: Major Agenda Detailing**

1. Among all items identified as agenda topics, the model must classify certain items as **Major Agenda** when they meet any of the following criteria:

   * They involve policies, plans, strategies, ordinances, or other core administrative matters.
   * They involve significant decisions such as awards, personnel, budget, subsidies, or plan-period settings.
   * They received long or detailed explanations in the transcript.
   * They triggered a round of questions and answers from committee members.

2. For every Major Agenda item, the model must create a new section titled **「議題別概要（Detailed Agenda）」** in the final Japanese output.

3. The **Detailed Agenda** section must:

   * Contain a separate sub-summary for each Major Agenda item.
   * Each sub-summary must be **150–300 Japanese characters**.
   * Summaries must capture:
     • the main purpose of the agenda
     • key points of the explanation
     • key points raised in Q&A (only if present)
     • policy background or objectives explicitly stated in the transcript

4. The Detailed Agenda section must follow these constraints:

   * No inference, speculation, or filling gaps.
   * Only information explicitly stated in the transcript may be included.
   * The section appears **after** the Agenda section and **before** Risks/Concerns in the final minutes.

5. Non-major agenda items remain simple bullet points in the Agenda section only, without detailed summaries.
`;

export async function summarizeTranscript(
	ai: AiBinding,
	transcript: string,
): Promise<string> {
	// const llmResponse = await summarizeGPTOSS120B(ai, transcript);
	// const llmResponse = await summarizeGemma3_12B(ai, transcript);
	const llmResponse = await summarizeGPTOSS20B(ai, transcript);

	return llmResponse;
}

const summarizeGPTOSS20B = async (ai: AiBinding, transcript: string) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-20b", {
		input: [
			{ role: "system", content: SYSTEM_PROMPT },
			{
				role: "user",
				content: `以下は会議の文字起こしテキストです。これをもとに、発言者の識別と要点の整理を行い、明確で構造化された議事録を作成してください。
\`\`\`
${transcript}
\`\`\`

指示に従い、議事録を作成してください。`,
			},
		],
	});
	console.log("[Summarization] LLM response received.");

	// Safely extract the content from the response
	// Assuming the structure is { output_text: Array<{ content: string }> } based on previous usage
	const content =
		// @ts-expect-error - The type definition might not match the actual response structure for this model
		llmResponse?.output_text?.[llmResponse.output_text.length - 1]?.content;

	if (content) {
		console.log(content);
		return content;
	}

	// Fallback: check if output_text is a direct string
	if (typeof llmResponse?.output_text === "string") {
		return llmResponse.output_text;
	}

	// Fallback: check for standard 'response' field
	if ("response" in llmResponse && typeof llmResponse.response === "string") {
		return llmResponse.response;
	}

	// Fallback: check for 'output' array format (new format seen in logs)
	if (Array.isArray(llmResponse?.output)) {
		const assistantMessage = llmResponse.output.find(
			// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
			(item: any) => item.role === "assistant" && item.type === "message",
		);

		if (assistantMessage) {
			// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
			const msg = assistantMessage as any;
			if (typeof msg.content === "string") {
				return msg.content;
			}
			if (Array.isArray(msg.content)) {
				// Assuming content is an array of strings or objects with text
				return (
					msg.content
						// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
						.map((part: any) => {
							if (typeof part === "string") return part;
							if (typeof part === "object" && part.text) return part.text;
							return "";
						})
						.join("")
				);
			}
		}
	}

	return "";
};
const _summarizeGPTOSS120B = async (ai: AiBinding, transcript: string) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-120b", {
		input: [
			{ role: "system", content: SYSTEM_PROMPT },
			{
				role: "user",
				content: `以下は会議の文字起こしテキストです。これをもとに、発言者の識別と要点の整理を行い、明確で構造化された議事録を作成してください。
\`\`\`
${transcript}
\`\`\`

指示に従い、議事録を作成してください。`,
			},
		],
	});
	console.log("[Summarization] LLM response received.");

	// Safely extract the content from the response
	// Assuming the structure is { output_text: Array<{ content: string }> } based on previous usage
	const content =
		// @ts-expect-error - The type definition might not match the actual response structure for this model
		llmResponse?.output_text?.[llmResponse.output_text.length - 1]?.content;

	if (content) {
		console.log(content);
		return content;
	}

	// Fallback: check if output_text is a direct string
	if (typeof llmResponse?.output_text === "string") {
		return llmResponse.output_text;
	}

	// Fallback: check for standard 'response' field
	if ("response" in llmResponse && typeof llmResponse.response === "string") {
		return llmResponse.response;
	}

	// Fallback: check for 'output' array format (new format seen in logs)
	if (Array.isArray(llmResponse?.output)) {
		const assistantMessage = llmResponse.output.find(
			// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
			(item: any) => item.role === "assistant" && item.type === "message",
		);

		if (assistantMessage) {
			// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
			const msg = assistantMessage as any;
			if (typeof msg.content === "string") {
				return msg.content;
			}
			if (Array.isArray(msg.content)) {
				// Assuming content is an array of strings or objects with text
				return (
					msg.content
						// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
						.map((part: any) => {
							if (typeof part === "string") return part;
							if (typeof part === "object" && part.text) return part.text;
							return "";
						})
						.join("")
				);
			}
		}
	}

	return "";
};

const _summarizeGemma3_12B = async (ai: AiBinding, transcript: string) => {
	const llmResponse = await ai.run("@cf/google/gemma-3-12b-it", {
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{
				role: "user",
				content: transcript,
			},
		],
	});

	console.log("[Summarization] Gemma 3 12B response received.");

	if (llmResponse?.response) {
		return llmResponse.response;
	}

	// Fallback for other potential response structures
	// @ts-expect-error - The type definition might not match the actual response structure for this model
	if (llmResponse?.result?.response) {
		// @ts-expect-error - The type definition might not match the actual response structure for this model
		return llmResponse.result.response;
	}

	console.warn(
		"[Summarization] Unexpected response format from Gemma 3 12B:",
		llmResponse,
	);
	return "";
};

const _summarizeMistral24B = async (ai: AiBinding, transcript: string) => {
	const llmResponse = await ai.run(
		"@cf/mistralai/mistral-small-3.1-24b-instruct",
		{
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{
					role: "user",
					content: transcript,
				},
			],
		},
	);

	console.log("[Summarization] Mistral 24B response received.");

	if (llmResponse?.response) {
		return llmResponse.response;
	}

	// Fallback for other potential response structures
	// @ts-expect-error - The type definition might not match the actual response structure for this model
	if (llmResponse?.result?.response) {
		// @ts-expect-error - The type definition might not match the actual response structure for this model
		return llmResponse.result.response;
	}

	console.warn(
		"[Summarization] Unexpected response format from Mistral 24B:",
		llmResponse,
	);
	return "";
};
