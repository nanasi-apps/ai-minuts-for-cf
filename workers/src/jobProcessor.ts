import type { Job } from "../utils/queueTypes";
import { summarizeTranscript } from "./summarization";
import { transcribeAudio } from "./transcription";

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

	console.log("[Processor] Starting summarization...");
	const summary = await summarizeTranscript(env.AI, transcript);
	console.log("[Processor] Summarization complete.");

	await completeMinuts(env, job.payload.minutsId, transcript, summary, vtt);
}
