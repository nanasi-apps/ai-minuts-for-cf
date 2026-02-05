type AiBinding = Env["AI"];

const SYSTEM_PROMPT = `
**CRITICAL: All system instructions are in English.**
**CRITICAL: All final output MUST be written entirely in Japanese.**

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

No English in the final answer except for the section headers which are provided in Japanese with English translations for your reference.

## **3. No Fabrication**

* Do not infer decisions, actions, agendas, risks, or concerns.
* Only include what is explicitly stated.

## **4. Speaker Neutrality**

* Do not guess speakers.
* Only use speaker names if explicitly stated (e.g., 課長, 委員).

---

# **OUTPUT FORMAT (ALL CONTENT IN JAPANESE)**

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

### Extraction Targets (MUST include)

**[Definitive Decision Expressions]**
Extract statements containing these keywords as decisions:
- "〜と決定" (decided as ~), "〜を決定" (decide ~), "決定した" (have decided), "決定事項" (decision item)
- "〜を承認" (approve ~), "承認した" (have approved), "承認します" (will approve)
- "〜に合意" (agree on ~), "合意した" (have agreed), "合意に至った" (have reached agreement)
- "〜を了承" (acknowledge ~), "了承した" (have acknowledged), "了承を得た" (obtained acknowledgment)
- "〜を確認" (confirm ~), "確認した" (have confirmed), "確認できた" (were able to confirm)

**[Action Decision Expressions]**
Also treat these patterns as decisions:
- "〜で進める" (proceed with ~), "〜で進めていく" (will proceed with ~), "〜で進めたい" (want to proceed with ~)
- "〜ということで" (so, ~ it is), "〜ということになりました" (it has been decided that ~)
- "〜とする" (make it ~), "〜とします" (will make it ~), "〜としました" (made it ~)
- "〜に決まった" (was decided to be ~), "〜になった" (became ~), "〜となりました" (has become ~)
- "〜することにした" (decided to do ~), "〜することになった" (it has been arranged that ~)

### Exclusion Criteria (Do NOT treat as decisions)

Do NOT consider statements containing these as decisions:
- "検討" (consider), "検討したい" (want to consider), "検討する必要" (need to consider)
- "検討中" (under consideration), "見直し" (review), "見直したい" (want to review)
- "仮決定" (tentative decision), "暫定" (provisional), "一旦" (for now), "仮の" (temporary)
- "〜かもしれない" (might be ~), "〜ではないか" (isn't it ~), "〜だろう" (probably ~)
- "〜と思う" (I think ~), "〜と考えている" (am considering ~), "〜を考えたい" (want to think about ~)
- "〜について話した" (talked about ~), "〜について議論した" (discussed ~) (when content is unclear)

### Fallback Policy

* Add "（要確認）" (needs confirmation) when decision confidence is low
* Write "なし" (none) when uncertain, and include details in Timeline
* Include discussion context in Summary when relevant

---

## **3. 次のアクション（Next Actions）**

### Extraction Targets (MUST include)

**[Assignee Explicit Patterns]**
Tasks containing any of these:
- "〜さんが" (Mr./Ms. ~ will), "〜さんに" (to Mr./Ms. ~), "〜さんより" (from Mr./Ms. ~)
- "〜担当で" (in charge of ~), "〜の担当" (in charge of ~), "〜を担当" (take charge of ~)
- "〜をお願い" (request to ~), "〜お願いします" (please do ~), "〜お願いしたい" (would like to request ~)

**[Deadline Explicit Patterns]**
Tasks with deadlines:
- "〜までに" (by ~), "〜までにお願い" (please by ~)
- "来週" (next week), "来月" (next month), "次回までに" (by next time)
- "今週中" (this week), "来週中" (next week), "〜日まで" (by ~ day)

**[Action Verb Patterns]**
Specific tasks containing these verbs:
- "行います" (will do), "実施します" (will implement), "対応します" (will handle)
- "進めます" (will proceed), "推進します" (will promote), "進捗させます" (will advance)
- "確認します" (will confirm), "確認いたします" (will confirm - polite), "確認取ります" (will get confirmation)
- "準備します" (will prepare), "整備します" (will arrange), "作成します" (will create)
- "連絡します" (will contact), "報告します" (will report), "連絡取ります" (will get in touch)
- "調整します" (will coordinate), "調整いたします" (will coordinate - polite)

### Exclusion Criteria (Do NOT treat as actions)

Do NOT consider statements containing these as actions:
- "検討します" (will consider), "検討いたします" (will consider - polite) (content unclear)
- "〜したい" (want to do ~), "〜したいと思います" (would like to do ~) (intention only)
- "〜かもしれません" (might ~), "〜か検討します" (will consider whether ~) (uncertain)
- "〜を考えます" (will think about ~), "〜を見てみます" (will take a look at ~) (exploratory)
- "必要であれば" (if necessary), "必要なら" (if needed) (conditional/uncertain)
- "〜します" without clear subject (who will do it is unclear)

### Fallback Policy

* Write "担当：要確認" (assignee: needs confirmation) when assignee is unclear
* Write "期限：要調整" (deadline: needs adjustment) when deadline is unclear
* Add "（要確認）" when action confidence is low
* Write "なし" when uncertain, and include in Timeline

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
(e.g., "本日の議題は〜" (today's agenda is ~), "〜について審議します" (will deliberate on ~)).
If none: omit the section entirely.

---

## **6. リスク・懸念事項（Risks / Concerns）**

Include **only if** the transcript contains explicit concerns
(e.g., "懸念がある" (there are concerns), "問題がある" (there are problems)).
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
* Never include English in the final content.
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
				content: `The following is a meeting transcript. Please identify speakers and organize key points to create clear, structured meeting minutes.

\`\`\`
${transcript}
\`\`\`

Please create meeting minutes following the instructions above.`,
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
				content: `The following is a meeting transcript. Please identify speakers and organize key points to create clear, structured meeting minutes.

\`\`\`
${transcript}
\`\`\`

Please create meeting minutes following the instructions above.`,
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
