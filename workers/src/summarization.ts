type AiBinding = Env["AI"];
export type MinutesLanguage = "ja" | "en";
export type MeetingType = "study_session" | "regular" | "decision";

type SummarizationOptions = {
	minutesLanguage?: MinutesLanguage;
	summaryPreference?: string;
	meetingType?: MeetingType;
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

const buildOutputFormat = (meetingType: MeetingType) => {
	if (meetingType === "study_session") {
		return `
1. 概要（Summary）
   * 50–180 characters.
   * Concise main points only; **no timeline info**.

2. 次のアクション（Next Actions）
   * Include tasks clearly verbalized as actions (e.g., 「〜を行います」「〜を進めます」「〜をお願いします」).
   * Also include explicit assignments or commitments:
     - 「担当」「依頼」「宿題」「TODO」「〜までに」「期限」「〜することになった」
   * Exclude vague intentions, hypotheticals, or non-commitments (e.g., 「〜したい」「〜できれば」「検討する」「可能性」).
   * No inferred tasks.
   * If none: 「なし」.

3. タイムライン（Timeline）
   * Max 10 bullets; 1 bullet = 1 key event.
   * Each bullet starts with the exact label \`[start - end]\` followed by a brief event.
   * No quotes; never convert labels.

4. 議題（Agenda）
   * Include only if explicit agenda items exist (e.g., 「本日の議題は〜」). Otherwise omit.

5. 議題別概要（Detailed Agenda）
   * Appears **after Agenda** and **before Risks/Concerns** when Major Agenda items exist.
   * For each Major Agenda item (policies/strategies/core matters, significant decisions, lengthy explanations, or Q&A topics):
     - Provide a sub-summary of **150–300 characters**.
     - Cover purpose, key explanation points, Q&A highlights (if any), and explicitly stated policy background/objectives.
   * No inference or speculation. Non-major agenda items stay only in Agenda.

6. リスク・懸念事項（Risks / Concerns）
   * Include only explicit concerns. Otherwise omit.

7. 要確認事項（Open Questions）
   * Include unanswered questions only. If none: omit.
`;
	}

	return `
1. 概要（Summary）
   * 50–180 characters.
   * Concise main points only; **no timeline info**.

2. 決定事項（Decisions）
   * Only items explicitly marked as decisions/approvals/agreements.
   * Accept explicit decision keywords/phrases such as:
     - 「決定」「決まり」「決まった」「承認」「承認された」「合意」「合意した」
     - 「了承」「可決」「採用」「確定」「締結」「合意に至った」
   * Exclude proposals, suggestions, or discussions not finalized (e.g., 「〜案」「検討」「提案」「議論中」「方向性」).
   * If none: 「なし」.

3. 次のアクション（Next Actions）
   * Include tasks clearly verbalized as actions (e.g., 「〜を行います」「〜を進めます」「〜をお願いします」).
   * Also include explicit assignments or commitments:
     - 「担当」「依頼」「宿題」「TODO」「〜までに」「期限」「〜することになった」
   * Exclude vague intentions, hypotheticals, or non-commitments (e.g., 「〜したい」「〜できれば」「検討する」「可能性」).
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

7. リスク・懸念事項（Risks / Concerns）
   * Include only explicit concerns. Otherwise omit.

8. 要確認事項（Open Questions）
   * Include unanswered questions only. If none: omit.
`;
};

const buildSystemPrompt = (
	minutesLanguage: MinutesLanguage,
	meetingType: MeetingType,
) => {
	const languageRules = LANGUAGE_OUTPUT_RULES[minutesLanguage];

	return `
**System language: English (instructions only)**
${languageRules.finalInstruction}

You are an accurate meeting-minutes editor for administrative committee transcripts.
Meeting type: ${meetingType}
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
   * If classification is ambiguous or negated, omit the item and use 「なし」 where required.

4) **Speaker neutrality**
   * Do not guess speakers.
   * Use speaker names only when explicitly provided (e.g., 課長, 委員).

---

# OUTPUT FORMAT (use the target output language for section titles and content)
${buildOutputFormat(meetingType)}

---

# STYLE

* ${languageRules.tone}
* Concise, factual, and non-redundant.
* No meta-comments or reasoning.
* Do not reorder events beyond the Timeline.
`;
};
const normalizeMinutesLanguage = (language: unknown): MinutesLanguage => {
	return language === "en" ? "en" : "ja";
};

const normalizeMeetingType = (meetingType: unknown): MeetingType => {
	if (meetingType === "study_session" || meetingType === "decision") {
		return meetingType;
	}
	return "regular";
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
	meetingType: MeetingType,
): string => {
	const instructions = normalizeSummaryPreference(summaryPreference);
	const languageLabel = minutesLanguage === "ja" ? "日本語" : "英語";
	const meetingTypeLabel = `Meeting type: ${meetingType}`;

	if (!instructions) {
		return `No extra user instructions. ${meetingTypeLabel}. Follow the required format in the target language (${languageLabel}).`;
	}

	return `User preference: ${instructions}\n${meetingTypeLabel}\nRespect this request and write the minutes in the target language (${languageLabel}).`;
};

const buildSummarizationMessages = (
	transcript: string,
	minutesLanguage: MinutesLanguage,
	summaryPreference: string,
	meetingType: MeetingType,
) => [
	{ role: "system", content: buildSystemPrompt(minutesLanguage, meetingType) },
	{
		role: "user",
		content: buildPreferencePrompt(
			summaryPreference,
			minutesLanguage,
			meetingType,
		),
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
	meetingType: MeetingType,
	feedback: string,
) => {
	if (!feedback) {
		return buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			meetingType,
		);
	}

	return [
		...buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			meetingType,
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
	meetingType: MeetingType,
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
3) Section headings appear in order. For meeting type "${meetingType}":
   - study_session: Summary, Next Actions, Timeline, Agenda, Detailed Agenda (only if applicable and placed after Agenda), Risks/Concerns, Open Questions.
   - regular/decision: Summary, Decisions, Next Actions, Timeline, Agenda, Detailed Agenda (only if applicable and placed after Agenda), Risks/Concerns, Open Questions.
   When absent, use 「なし」 or omit according to the rules.
4) Timeline lines each start with a label like [0.00 - 1.00] and there are at most 10.
5) Detailed Agenda appears after Agenda and before Risks/Concerns when present.
6) Decisions/Next Actions include only explicit commitments or approvals; exclude proposals, wishes, or speculation.
7) No fabrication; the minutes must be concise and structured.
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
	meetingType: MeetingType,
): Promise<QualityCheckResult> => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-20b", {
		input: buildQualityCheckMessages(
			transcript,
			summary,
			minutesLanguage,
			meetingType,
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
	const meetingType = normalizeMeetingType(options?.meetingType);
	let feedback = "";
	let summary = "";

	for (let attempt = 1; attempt <= MAX_SUMMARIZATION_ATTEMPTS; attempt += 1) {
		summary = await summarizeGPTOSS20B(
			ai,
			transcript,
			targetLanguage,
			summaryPreference,
			meetingType,
			feedback,
		);

		const quality = await checkMinutesQuality(
			ai,
			transcript,
			summary,
			targetLanguage,
			meetingType,
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
	meetingType: MeetingType,
	feedback: string,
) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-20b", {
		input: buildFeedbackAwareSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			meetingType,
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
	meetingType: MeetingType,
) => {
	const llmResponse = await ai.run("@cf/openai/gpt-oss-120b", {
		input: buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			meetingType,
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
	meetingType: MeetingType,
) => {
	const llmResponse = await ai.run("@cf/google/gemma-3-12b-it", {
		messages: buildSummarizationMessages(
			transcript,
			minutesLanguage,
			summaryPreference,
			meetingType,
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
	meetingType: MeetingType,
) => {
	const llmResponse = await ai.run(
		"@cf/mistralai/mistral-small-3.1-24b-instruct",
		{
			messages: buildSummarizationMessages(
				transcript,
				minutesLanguage,
				summaryPreference,
				meetingType,
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
