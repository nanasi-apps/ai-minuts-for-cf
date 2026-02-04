import type { Job } from "../utils/queueTypes";
import { type MinutesLanguage, summarizeTranscript } from "./summarization";
import { transcribeAudio } from "./transcription";

const SUMMARY_PREFERENCE_MAX_LENGTH = 120;

type UserSettings = {
	minutesLanguage: MinutesLanguage;
	summaryPreference: string;
};

const normalizeMinutesLanguage = (language: unknown): MinutesLanguage => {
	return language === "en" ? "en" : "ja";
};

const normalizeSummaryPreference = (preference: unknown): string => {
	if (typeof preference !== "string") return "";
	return preference.trim().slice(0, SUMMARY_PREFERENCE_MAX_LENGTH);
};

async function fetchMinutsRecord(env: Env, minutsId: number) {
	const record = await env.ai_minuts
		.prepare("SELECT * FROM Minuts WHERE id = ?")
		.bind(minutsId)
		.first();

	if (!record) {
		throw new Error(`Minuts not found for id: ${minutsId}`);
	}

	return record;
}

async function fetchUserSettings(
	env: Env,
	userId: number,
): Promise<UserSettings> {
	const record = await env.ai_minuts
		.prepare("SELECT minutesLanguage, summaryPreference FROM User WHERE id = ?")
		.bind(userId)
		.first();

	const minutesLanguage = normalizeMinutesLanguage(record?.minutesLanguage);
	const summaryPreference = normalizeSummaryPreference(
		record?.summaryPreference,
	);

	return { minutesLanguage, summaryPreference };
}

async function ensureR2Object(env: Env, videoKey: string) {
	const object = await env.minuts_videos.get(videoKey);
	if (!object) {
		throw new Error(`File not found in R2: ${videoKey}`);
	}

	return object;
}

async function updateStatus(env: Env, minutsId: number, status: string) {
	await env.ai_minuts
		.prepare("UPDATE Minuts SET status = ? WHERE id = ?")
		.bind(status, minutsId)
		.run();
}

async function completeMinuts(
	env: Env,
	minutsId: number,
	transcript: string,
	summary: string,
	subtitle: string | null,
) {
	await env.ai_minuts
		.prepare(
			"UPDATE Minuts SET status = ?, transcript = ?, summary = ?, subtitle = ? WHERE id = ?",
		)
		.bind("COMPLETED", transcript, summary, subtitle, minutsId)
		.run();
}

const TIMELINE_LABEL_PATTERN = /^\[(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\]/;

const parseMeetingStartTime = (value: unknown): number | null => {
	if (typeof value !== "string" || !value.trim()) {
		return null;
	}

	const match = value.match(/(\d{1,2}):(\d{2})/);
	if (!match) {
		return null;
	}

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (Number.isNaN(hours) || Number.isNaN(minutes)) {
		return null;
	}

	return hours * 3600 + minutes * 60;
};

const formatClockLabel = (totalSeconds: number): string => {
	const normalized = ((totalSeconds % 86400) + 86400) % 86400;
	const hours = Math.floor(normalized / 3600)
		.toString()
		.padStart(2, "0");
	const minutes = Math.floor((normalized % 3600) / 60)
		.toString()
		.padStart(2, "0");
	return `${hours}:${minutes}`;
};

const applyMeetingStartTime = (
	transcript: string,
	meetingStartTimeSeconds: number | null,
): string => {
	if (meetingStartTimeSeconds === null) {
		return transcript;
	}

	return transcript
		.split("\n")
		.map((line) => {
			const match = line.match(TIMELINE_LABEL_PATTERN);
			if (!match) return line;

			const startSeconds = Number(match[1]);
			const endSeconds = Number(match[2]);
			if (Number.isNaN(startSeconds) || Number.isNaN(endSeconds)) {
				return line;
			}

			const startLabel = formatClockLabel(
				meetingStartTimeSeconds + startSeconds,
			);
			const endLabel = formatClockLabel(meetingStartTimeSeconds + endSeconds);
			return line.replace(
				TIMELINE_LABEL_PATTERN,
				`[${startLabel} - ${endLabel}]`,
			);
		})
		.join("\n");
};

async function buildTranscript(
	env: Env,
	action: Job["payload"]["action"],
	object: R2ObjectBody,
	existingTranscript: string | null,
	existingSubtitle: string | null,
) {
	if (action === "summarize_only") {
		if (!existingTranscript) {
			throw new Error("Transcript not found for summarization.");
		}
		console.log(
			"[Processor] Skipping transcription, using existing transcript.",
		);
		return { transcript: existingTranscript, vtt: existingSubtitle };
	}

	console.log("[Processor] Starting transcription with chunking (Whisper)...");
	return transcribeAudio(object, env);
}

export async function processMinutsJob(env: Env, job: Job): Promise<void> {
	const minuts = await fetchMinutsRecord(env, job.payload.minutsId);
	const userSettings = await fetchUserSettings(env, minuts.userId as number);
	const audioKey = minuts.audioKey as string | null;
	const videoKey = minuts.videoKey as string;
	const targetKey = audioKey || videoKey;

	console.log(
		`[Processor] Found targetKey: ${targetKey} (Audio: ${!!audioKey})`,
	);

	const object = await ensureR2Object(env, targetKey);
	console.log(`[Processor] File exists in R2, size: ${object.size}`);

	await updateStatus(env, job.payload.minutsId, "PROCESSING");

	const { transcript, vtt } = await buildTranscript(
		env,
		job.payload.action || "transcribe_and_summarize",
		object,
		minuts.transcript as string,
		minuts.subtitle as string | null,
	);

	const meetingStartTimeSeconds = parseMeetingStartTime(
		minuts.meetingStartTime,
	);
	const transcriptForSummary = applyMeetingStartTime(
		transcript,
		meetingStartTimeSeconds,
	);

	console.log("[Processor] Starting summarization...");
	const summary = await summarizeTranscript(
		env.AI,
		transcriptForSummary,
		userSettings,
	);
	console.log("[Processor] Summarization complete.");

	await completeMinuts(env, job.payload.minutsId, transcript, summary, vtt);
}
