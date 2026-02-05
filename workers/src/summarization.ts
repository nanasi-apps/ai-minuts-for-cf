type AiBinding = Env["AI"];
export type MinutesLanguage = "ja" | "en";

type SummarizationOptions = {
	minutesLanguage?: MinutesLanguage;
	summaryPreference?: string;
};

type QualityCheckResult = {
	passed: boolean;
	feedback: string;
};

const SUMMARY_PREFERENCE_MAX_LENGTH = 120;

const LANGUAGE_OUTPUT_RULES: Record<
	MinutesLanguage,
	{ finalInstruction: string; tone: string }
> = {
	ja: {
		finalInstruction:
			"**The final answer must be written entirely in Japanese.**",
		tone: "Formal, neutral Japanese suitable for official meeting minutes.",
	},
	en: {
		finalInstruction:
			"**The final answer must be written entirely in English.**",
		tone: "Formal, neutral English suitable for official meeting minutes.",
	},
};

const buildSystemPrompt = (minutesLanguage: MinutesLanguage) => {
	const languageRules = LANGUAGE_OUTPUT_RULES[minutesLanguage];

	return `
**System language: English (instructions only)**
${languageRules.finalInstruction}

You are an accurate meeting-minutes editor for administrative committee transcripts.
The transcript format is:

\`\`\`
[start - end] text
\`\`\`

These numeric labels are **plain strings, not timestamps**. Do **not** convert or interpret them.
Your job is to create structured minutes that satisfy every rule below.

---

# CRITICAL RULES

1) **Timestamp handling**
   * Labels such as \`[0.00 - 1.78]\` are not time values.
   * Treat them as raw strings and copy them exactly in the Timeline.

2) **Output language**
   * ${languageRules.finalInstruction}
   * Do not use any other language in the final answer.

3) **No fabrication**
   * Do not infer decisions, actions, agendas, risks, or concerns.
   * Only include statements explicitly present in the transcript.

4) **Speaker neutrality**
   * Do not guess speakers.
   * Use speaker names only when explicitly provided (e.g., 課長, 委員).

---

# OUTPUT FORMAT (use the target output language for section titles and content)

1. 概要（Summary）
   * 50–180 characters.
   * Concise main points only; **no timeline info**.

2. 決定事項（Decisions）
   * Only items explicitly marked as decisions/approvals/agreements.
   * If none: 「なし」.

3. 次のアクション（Next Actions）
   * Include tasks clearly verbalized as actions (e.g., 「〜を行います」「〜を進めます」「〜をお願いします」).
   * No inferred tasks.
   * If none: 「なし」.

4. タイムライン（Timeline）
   * Max 10 bullets; 1 bullet = 1 key event.
   * Each bullet starts with the exact label \`[start - end]\` followed by a brief event.
   * No quotes; never convert labels.

5. 議題（Agenda）
   * Include only if explicit agenda items exist (e.g., 「本日の議題は〜」). Otherwise omit.

6. 議題別概要（Detailed Agenda）
   * Appears **after Agenda** and **before Risks/Concerns** when Major Agenda items exist.
   * For each Major Agenda item (policies/strategies/core matters, significant decisions, lengthy explanations, or Q&A topics):
     - Provide a sub-summary of **150–300 characters**.
     - Cover purpose, key explanation points, Q&A highlights (if any), and explicitly stated policy background/objectives.
   * No inference or speculation. Non-major agenda items stay only in Agenda.

### Extraction Targets

**[High-Confidence - Extract directly]**
- Definitive: 「決定」「確定」「承認」「可決」「採択」「議決」
- Agreement: 「合意」「了承」「認める」「成立」
- Parliamentary: 「全会一致」「賛成多数」「異議なく」「原案どおり」

**[Medium-Confidence - Extract with context]**
- Directional: 「〜で進める」「〜とする」「〜ということで」「〜に決まった」「〜することになった」
- Implicit: 「〜で行く」「〜を採用」「〜を実施する」「〜の方向で」

**[Low-Confidence - Add "（要確認）"]**
- 「〜を確認」(only when confirming a decision, not information)
- 「〜で良い」「〜で問題ない」(only when finalizing a choice)

### Exclusion Criteria (NEVER extract)

- Under review: 「検討」「見直し」「再検討」「審議中」「協議中」
- Tentative: 「仮決定」「暫定」「一旦」「当面」「とりあえず」
- Uncertain: 「〜かもしれない」「〜だろう」「〜と思う」「〜と考えている」
- Proposal: 「提案」「希望」「要望」「〜してはどうか」「素案」「たたき台」
- Inconclusive: 「〜について議論した」「意見交換」「今後の課題」「継続審議」

### Fallback Policy

- High: Clear keyword + clear scope → extract as-is
- Medium: Implicit expression + clear scope → extract with context
- Low: Keyword present but scope vague → add "（要確認）"
- None: Only exclusion expressions → write "なし"

---

## **3. 次のアクション（Next Actions）**

### Extraction Targets

**[High-Confidence - Extract directly]**
- Assignee explicit: 「〜さんが」「〜担当」「〜にお願い」「〜課が」「〜部が」「事務局が」
- Formal assignment: 「〜に一任」「〜に委任」「〜に依頼」「〜の責任で」
- Deadline explicit: 「〜までに」「来週」「来月」「次回までに」「今週中」「速やかに」「至急」

**[Medium-Confidence - Add assignee/deadline annotation if missing]**
- Action verbs: 「実施します」「対応します」「確認します」「準備します」「報告します」「調整します」「作成します」「連絡します」
- Follow-up: 「次回報告」「次回確認」「後日」「改めて」

**[Low-Confidence - Add "（要確認）"]**
- 「〜を検討して報告」「〜を確認して連絡」(extract if deadline/assignee present)

### Exclusion Criteria (NEVER extract)

* ${languageRules.tone}
* Concise, factual, and non-redundant.
* No meta-comments or reasoning.
* Do not reorder events beyond the Timeline.

- Exploratory: 「検討します」(when deliverable unclear)「〜を考えます」「〜を見てみます」
- Intent only: 「〜したい」「〜したいと思います」
- Uncertain: 「〜かもしれません」「〜か検討します」
- Conditional: 「必要であれば」「可能であれば」「余裕があれば」「状況を見て」
- Vague: 「引き続き」(no specific step)「今後」(no deadline)「いずれ」「適宜」
- Past completed: 「〜しました」「〜を行った」(unless tied to next steps)

### Fallback Policy

- High: Assignee + task clear → [Assignee] [Task] [Deadline if any]
- Medium: Task clear but assignee unclear → add "担当：要確認"
- Low: Action verb present but scope vague → add "（要確認）"
- None: Only exclusion expressions → write "なし"

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
};
const normalizeMinutesLanguage = (language: unknown): MinutesLanguage => {
	return language === "en" ? "en" : "ja";
};

const normalizeSummaryPreference = (preference: unknown): string => {
	if (typeof preference !== "string") return "";
	return preference.trim().slice(0, SUMMARY_PREFERENCE_MAX_LENGTH);
};

const extractAssistantContent = (llmResponse: unknown): string => {
	const content =
		// @ts-expect-error - The type definition might not match the actual response structure for this model
		llmResponse?.output_text?.[llmResponse.output_text.length - 1]?.content;

	if (content) {
		return content as string;
	}

	// Fallback: check if output_text is a direct string
	// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
	if (typeof (llmResponse as any)?.output_text === "string") {
		// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
		return (llmResponse as any).output_text as string;
	}

	// Fallback: check for standard 'response' field
	if (typeof llmResponse === "object" && llmResponse !== null) {
		const responseCandidate = llmResponse as { response?: unknown };
		if (typeof responseCandidate.response === "string") {
			return responseCandidate.response;
		}
	}

	// Fallback: check for 'output' array format (new format seen in logs)
	// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
	if (Array.isArray((llmResponse as any)?.output)) {
		// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
		const assistantMessage = (llmResponse as any).output.find(
			// biome-ignore lint/suspicious/noExplicitAny: 型かおかしいのでこれでいい
			(item: any) => item.role === "assistant" && item.type === "message",
		);

		if (assistantMessage) {
			// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
			const msg = assistantMessage as any;
			if (typeof msg.content === "string") {
				return msg.content;
			}
			if (Array.isArray(msg.content)) {
				// Assuming content is an array of strings or objects with text
				return (
					msg.content
						// biome-ignore lint/suspicious/noExplicitAny: 型が曖昧なので any で扱う
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

const buildPreferencePrompt = (
	summaryPreference: string,
	minutesLanguage: MinutesLanguage,
): string => {
	const instructions = normalizeSummaryPreference(summaryPreference);
	const languageLabel = minutesLanguage === "ja" ? "日本語" : "英語";

	if (!instructions) {
		return `No extra user instructions. Follow the required format in the target language (${languageLabel}).`;
	}

	return `User preference: ${instructions}\nRespect this request and write the minutes in the target language (${languageLabel}).`;
};

const buildSummarizationMessages = (
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
) => [
	{ role: "system", content: buildSystemPrompt(minutesLanguage) },
	{
		role: "user",
		content: buildPreferencePrompt(summaryPreference, minutesLanguage),
	},
	{
		role: "user",
		content: `Here is the meeting transcript. Identify speakers only when explicit and organize key points into clear, structured minutes.
\`\`\`
${transcript}
\`\`\`

Follow all instructions above and produce the minutes.`,
	},
];

const buildFeedbackAwareSummarizationMessages = (
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
	feedback: string,
) => {
	if (!feedback) {
		return buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
		);
	}

	return [
		...buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
		),
		{
			role: "user",
			content: `Quality issues detected in the previous draft: ${feedback}\nRegenerate the minutes resolving every issue.`,
		},
	];
};

const buildQualityCheckMessages = (
	transcript: string,
	summary: string,
	minutesLanguage: MinutesLanguage,
) => [
	{
		role: "system",
		content:
			"You are a strict quality inspector for meeting minutes. Respond only with minified JSON and no other text.",
	},
	{
		role: "user",
		content: `Validate whether the minutes meet the specification. Reply ONLY with JSON in the format {"passed": boolean, "feedback": "If problems exist, explain them concisely in Japanese"}.
Checks:
1) Output language must be ${minutesLanguage === "ja" ? "Japanese" : "English"} only.
2) Summary length is 50–180 characters.
3) Section headings appear in order: Summary, Decisions, Next Actions, Timeline, Agenda, Detailed Agenda (only if applicable and placed after Agenda), Risks/Concerns, Open Questions. When absent, use 「なし」 or omit according to the rules.
4) Timeline lines each start with a label like [0.00 - 1.00] and there are at most 10.
5) Detailed Agenda appears after Agenda and before Risks/Concerns when present.
6) No fabrication; the minutes must be concise and structured.
---
Minutes:
${summary}
---
Original transcript:
${transcript}`,
	},
];

const parseQualityCheckResult = (raw: string): QualityCheckResult => {
	if (!raw) {
		return { passed: false, feedback: "品質検証の応答が空でした。" };
	}

	try {
		const parsed = JSON.parse(raw) as {
			passed?: unknown;
			feedback?: unknown;
		};

		return {
			passed: parsed.passed === true,
			feedback:
				typeof parsed.feedback === "string"
					? parsed.feedback
					: "品質検証結果を読み取れませんでした。",
		};
	} catch (error) {
		console.warn("[Summarization] Failed to parse quality check JSON.", error);
		return {
			passed: false,
			feedback: "品質検証結果の解析に失敗しました。",
		};
	}
};

const checkMinutesQuality = async (
	ai: AiBinding,
	transcript: string,
	summary: string,
	minutesLanguage: MinutesLanguage,
): Promise<QualityCheckResult> => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-20b", {
		input: buildQualityCheckMessages(
			transcript,
			summary,
			minutesLanguage,
		) as ResponseInput,
	});

	const content = extractAssistantContent(llmResponse);
	return parseQualityCheckResult(content);
};

const MAX_SUMMARIZATION_ATTEMPTS = 2;

export async function summarizeTranscript(
	ai: AiBinding,
	transcript: string,
	options?: SummarizationOptions,
): Promise<string> {
	const targetLanguage = normalizeMinutesLanguage(options?.minutesLanguage);
	const summaryPreference = normalizeSummaryPreference(
		options?.summaryPreference,
	);
	let feedback = "";
	let summary = "";

	for (let attempt = 1; attempt <= MAX_SUMMARIZATION_ATTEMPTS; attempt += 1) {
		summary = await summarizeGPTOSS20B(
			ai,
			transcript,
			targetLanguage,
			summaryPreference,
			feedback,
		);

		const quality = await checkMinutesQuality(
			ai,
			transcript,
			summary,
			targetLanguage,
		);

		if (quality.passed) {
			return summary;
		}

		feedback =
			quality.feedback ||
			"出力フォーマットと品質要件をすべて満たすよう修正してください。";

		console.warn(
			`[Summarization] Quality check failed (attempt ${attempt}/${MAX_SUMMARIZATION_ATTEMPTS}): ${feedback}`,
		);
	}

	return summary;
}

const summarizeGPTOSS20B = async (
	ai: AiBinding,
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
	feedback: string,
) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-20b", {
		input: buildFeedbackAwareSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			feedback,
		) as ResponseInput,
	});
	console.log("[Summarization] LLM response received.");

	const content = extractAssistantContent(llmResponse);

	if (content) {
		console.log(content);
		return content;
	}

	return "";
};
const _summarizeGPTOSS120B = async (
	ai: AiBinding,
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-120b", {
		input: buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
		) as ResponseInput,
	});
	console.log("[Summarization] LLM response received.");

	const content = extractAssistantContent(llmResponse);

	if (content) {
		console.log(content);
		return content;
	}

	return "";
};

const _summarizeGemma3_12B = async (
	ai: AiBinding,
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
) => {
	const llmResponse = await ai.run("@cf/google/gemma-3-12b-it", {
		messages: buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
		),
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

const _summarizeMistral24B = async (
	ai: AiBinding,
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
) => {
	const llmResponse = await ai.run(
		"@cf/mistralai/mistral-small-3.1-24b-instruct",
		{
			messages: buildSummarizationMessages(
				transcript,
				minutesLanguage,
				summaryPreference,
			),
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
