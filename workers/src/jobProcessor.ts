import type { Job } from "../utils/queueTypes";
import { transcribeAudio } from "./transcription";
import { summarizeTranscript } from "./summarization";

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

async function completeMinuts(env: Env, minutsId: number, transcript: string, summary: string) {
        await env.ai_minuts
                .prepare("UPDATE Minuts SET status = ?, transcript = ?, summary = ? WHERE id = ?")
                .bind("COMPLETED", transcript, summary, minutsId)
                .run();
}

async function buildTranscript(
        env: Env,
        action: Job["payload"]["action"],
        object: R2ObjectBody,
        existingTranscript: string | null,
) {
        if (action === "summarize_only") {
                if (!existingTranscript) {
                        throw new Error("Transcript not found for summarization.");
                }
                console.log("[Processor] Skipping transcription, using existing transcript.");
                return existingTranscript;
        }

        console.log("[Processor] Starting transcription with chunking (Whisper)...");
        return transcribeAudio(object, env.AI);
}

export async function processMinutsJob(env: Env, job: Job): Promise<void> {
        const minuts = await fetchMinutsRecord(env, job.payload.minutsId);
        const videoKey = minuts.videoKey as string;
        console.log(`[Processor] Found videoKey: ${videoKey}`);

        const object = await ensureR2Object(env, videoKey);
        console.log(`[Processor] File exists in R2, size: ${object.size}`);

        await updateStatus(env, job.payload.minutsId, "PROCESSING");

        const transcript = await buildTranscript(
                env,
                job.payload.action || "transcribe_and_summarize",
                object,
                minuts.transcript as string,
        );

        console.log("[Processor] Starting summarization...");
        const summary = await summarizeTranscript(env.AI, transcript);
        console.log("[Processor] Summarization complete.");

        await completeMinuts(env, job.payload.minutsId, transcript, summary);
}
