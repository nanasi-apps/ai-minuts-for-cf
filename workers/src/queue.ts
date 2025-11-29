import { Buffer } from "node:buffer";
import type { Job } from "../utils/queueTypes";

export class QueueDO implements DurableObject {
	state: DurableObjectState;
	env: Env;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === "/enqueue" && request.method === "POST") {
			const job = (await request.json()) as Job;
			await this.enqueue(job);
			return new Response(JSON.stringify({ success: true, jobId: job.id }), {
				status: 200,
			});
		}

		if (path === "/dequeue" && request.method === "GET") {
			const job = await this.dequeue();
			return new Response(JSON.stringify(job), { status: 200 });
		}

		if (path === "/complete" && request.method === "POST") {
			const { id } = (await request.json()) as { id: string };
			await this.complete(id);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		if (path === "/retry" && request.method === "POST") {
			const { id, error } = (await request.json()) as {
				id: string;
				error: string;
			};
			await this.retry(id, error);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		if (path === "/fail" && request.method === "POST") {
			const { id, error } = (await request.json()) as {
				id: string;
				error: string;
			};
			await this.fail(id, error);
			return new Response(JSON.stringify({ success: true }), { status: 200 });
		}

		return new Response("Not Found", { status: 404 });
	}

	async alarm() {
		const job = await this.dequeue();
		if (job) {
			console.log(`[QueueDO] Alarm fired. Processing job ${job.id}`);
			await this.processJob(job);

			// Check if there are more jobs waiting
			const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
			if (jobs.some((j) => j.status === "waiting")) {
				console.log("[QueueDO] More jobs waiting. Scheduling next alarm.");
				await this.state.storage.setAlarm(Date.now() + 100);
			}
		}
	}

	async enqueue(job: Job) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		jobs.push(job);
		await this.state.storage.put("jobs", jobs);
		console.log(`[QueueDO] Enqueued job ${job.id}`);
		// Schedule alarm if not already scheduled
		const currentAlarm = await this.state.storage.getAlarm();
		const alarmTime = currentAlarm
			? new Date(currentAlarm).toLocaleString("ja-JP", {
					timeZone: "Asia/Tokyo",
				})
			: "null";
		console.log(`[QueueDO] Current alarm: ${alarmTime}`);
		if (currentAlarm === null || currentAlarm < Date.now()) {
			console.log("[QueueDO] Scheduling alarm (new or resetting stuck alarm).");
			await this.state.storage.deleteAlarm(); // Clear just in case
			await this.state.storage.setAlarm(Date.now() + 100); // Set for immediate future
		}
	}

	async dequeue(): Promise<Job | null> {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const nextJob = jobs.find((j) => j.status === "waiting");
		if (nextJob) {
			nextJob.status = "processing";
			nextJob.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
			return nextJob;
		}
		return null;
	}

	async complete(id: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "done";
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

	async retry(id: string, error: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "waiting"; // Reset to waiting
			job.retryCount = (job.retryCount || 0) + 1;
			job.error = error; // Log the error that caused retry
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

	async fail(id: string, error: string) {
		const jobs = (await this.state.storage.get<Job[]>("jobs")) || [];
		const job = jobs.find((j) => j.id === id);
		if (job) {
			job.status = "failed";
			job.error = error;
			job.updatedAt = Date.now();
			await this.state.storage.put("jobs", jobs);
		}
	}

	async processJob(job: Job) {
		console.log(
			`Processing job ${job.id} for minutsId: ${job.payload.minutsId}`,
		);

		try {
			// Fetch metadata from D1
			const minuts = await this.env.ai_minuts
				.prepare("SELECT * FROM Minuts WHERE id = ?")
				.bind(job.payload.minutsId)
				.first();

			if (!minuts) {
				throw new Error(`Minuts not found for id: ${job.payload.minutsId}`);
			}

			const videoKey = minuts.videoKey as string;
			console.log(`Found videoKey: ${videoKey}`);

			// Check if file exists in R2
			const object = await this.env.minuts_videos.get(videoKey);
			if (!object) {
				throw new Error(`File not found in R2: ${videoKey}`);
			}

			console.log(`File exists in R2, size: ${object.size}`);

			// Update status to PROCESSING
			await this.env.ai_minuts
				.prepare("UPDATE Minuts SET status = ? WHERE id = ?")
				.bind("PROCESSING", job.payload.minutsId)
				.run();

			const action = job.payload.action || "transcribe_and_summarize";
			let transcript = "";

			if (action === "transcribe_and_summarize") {
				// 1. Transcribe with Whisper (with Chunking)
				console.log("Starting transcription with chunking (Whisper)...");

				if (!object.body) {
					throw new Error("Object body is null");
				}

				// Read the body into an ArrayBuffer
				const audioBuffer = await object.arrayBuffer();
				const contentType = object.httpMetadata?.contentType || "audio/mpeg";
				console.log(
					`Audio size: ${audioBuffer.byteLength}, Content-Type: ${contentType}`,
				);

				const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
				const allSegments: any[] = [];
				let timeOffset = 0;
				const totalChunks = Math.ceil(audioBuffer.byteLength / CHUNK_SIZE);

				console.log(`Splitting into ${totalChunks} chunks...`);
				const startTime = Date.now();

				for (let i = 0; i < audioBuffer.byteLength; i += CHUNK_SIZE) {
					const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
					console.log(`Processing chunk ${chunkIndex}/${totalChunks}...`);

					const chunk = audioBuffer.slice(i, i + CHUNK_SIZE);
					const base64Audio = Buffer.from(chunk).toString("base64");

					let chunkSuccess = false;
					let attempt = 0;
					const MAX_RETRIES = 3;

					while (attempt < MAX_RETRIES && !chunkSuccess) {
						attempt++;
						try {
							const whisperResponse = (await this.env.AI.run(
								"@cf/openai/whisper-large-v3-turbo",
								{
									audio: base64Audio,
									language: "ja",
								},
							)) as any;

							if (whisperResponse.segments) {
								const chunksSegments = whisperResponse.segments.map(
									(s: any) => ({
										start: s.start + timeOffset,
										end: s.end + timeOffset,
										text: s.text,
									}),
								);
								allSegments.push(...chunksSegments);

								const duration =
									whisperResponse.transcription_info?.duration ||
									(chunksSegments.length > 0
										? chunksSegments[chunksSegments.length - 1].end - timeOffset
										: 0);
								timeOffset += duration;
							} else if (whisperResponse.text) {
								allSegments.push({
									start: timeOffset,
									end: timeOffset + 1,
									text: whisperResponse.text,
								});
								timeOffset += 10;
							} else {
								console.warn(`Chunk ${chunkIndex}: No text found.`);
							}
							chunkSuccess = true;
						} catch (e) {
							console.error(
								`Error processing chunk ${chunkIndex} (Attempt ${attempt}/${MAX_RETRIES}):`,
								e,
							);
							if (attempt < MAX_RETRIES) {
								console.log(`Retrying chunk ${chunkIndex} in 3s...`);
								await new Promise((r) => setTimeout(r, 3000));
							}
						}
					}

					if (!chunkSuccess) {
						console.error(
							`Failed to process chunk ${chunkIndex} after ${MAX_RETRIES} attempts. Skipping.`,
						);
					}

					await new Promise((r) => setTimeout(r, 500));
				}

				const endTime = Date.now();
				console.log(
					`Transcription completed in ${(endTime - startTime) / 1000} seconds.`,
				);

				transcript = allSegments
					.map((s) => `[${s.start.toFixed(2)} - ${s.end.toFixed(2)}] ${s.text}`)
					.join("\n");
				console.log("Transcription complete.");
			} else {
				console.log("Skipping transcription, using existing transcript.");
				transcript = minuts.transcript as string;
				if (!transcript) {
					throw new Error("Transcript not found for summarization.");
				}
			}

			// 2. Summarize with Llama-3
			console.log("Starting summarization...");
			const systemPrompt = `
# System Prompt (Meeting Minutes Generator)

You are an excellent meeting minutes assistant.
Your task is to generate **clear, structured, and strictly evidence-based meeting minutes** from a given meeting transcription text.

## Input Format

The user will provide transcription segments in the format:

\`[start - end] text\`

The transcription contains **no speaker labels**.

## Speaker Identification Rules

You must infer speaker changes **only** using information visible in the transcript:

1. **Silence Gap**
   If the next segment’s \`start\` time is significantly later than the previous segment’s \`end\` time, treat it as a likely speaker change.

2. **Context & Tone Shift**
   If the content clearly changes topic, or if the style changes (e.g., question vs. answer), infer a speaker change.

3. **Segment Boundaries**
   Whisper’s automatic segmentation often indicates natural pauses, which may imply a speaker switch.

If speaker identity is unknown, assign generic labels: **Speaker A, Speaker B, Speaker C**, and so on.

## Absolute Restrictions

These rules must be followed **without exception**:

### 1. **Do NOT write anything that does not explicitly appear in the transcript**

This means:

* No speculation, no guessing, no assumptions
* No adding general knowledge
* No filling in missing context
* No creating content or explanations
* No describing roles, emotions, intentions, positions, or identities unless explicitly stated in the transcript

### 2. **Do NOT alter the meaning of the transcript**

* Summaries must reflect only what is said
* You may compress text, but you may NOT reinterpret, extend, or modify meaning
* Do not infer decisions or tasks unless explicitly stated

### 3. **All output must be strictly transcript-based**

Your role is **summarization and structuring**, not supplementation.

## Output Format (Markdown)

All output must be written in **Japanese**, unless the user explicitly requests otherwise.

Use the following structure (omit sections if no corresponding information exists; do NOT fill gaps with invented content):

### 概要（Summary）

Summarize the entire meeting based solely on transcript content.

### 決定事項（Decisions）

List only the decisions that are **explicitly stated** as agreed or decided.

### 次のアクション（Next Actions）

List only the tasks or actions explicitly stated in the transcript.

### 話者別サマリ（Speaker Summary）

Summarize the main points from each inferred speaker.
Use labels such as Speaker A / Speaker B.

### タイムライン（Timeline, Optional）

If useful, present key points in chronological order.
Use only transcript content, without adding interpretation.

### 議題（Agenda, if present）

Include only if the transcript clearly states agenda items.

### リスク・懸念事項（Risks / Concerns, if present）

Include only if explicitly stated as concerns in the transcript.

### 要確認事項（Open Questions, if present）

List only unresolved questions mentioned in the transcript.

## Additional Notes

* Absolutely no invented content.
* Absolutely no extrapolation.
* Absolutely no contextual assumptions.
* No reinterpretation of meaning.
* No describing anything not contained in the transcript.
* All speaker inference must rely solely on timestamps and textual clues.
* All output must be in japanese unless otherwise specified by the user.
`;
			const llmResponse = (await this.env.AI.run(
				"@cf/meta/llama-3-8b-instruct",
				{
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: transcript },
					],
				},
			)) as any;

			const summary = llmResponse.response || llmResponse.result || "";
			console.log("Summarization complete.");

			// Update status in D1 to COMPLETED
			await this.env.ai_minuts
				.prepare(
					"UPDATE Minuts SET status = ?, transcript = ?, summary = ? WHERE id = ?",
				)
				.bind("COMPLETED", transcript, summary, job.payload.minutsId)
				.run();

			// Complete job
			await this.complete(job.id);
		} catch (e) {
			console.error(`Job failed: ${e}`);

			// Retry logic
			if ((job.retryCount || 0) < 3) {
				console.log(
					`Retrying job ${job.id} (attempt ${(job.retryCount || 0) + 1})`,
				);
				await this.retry(job.id, String(e));

				// Reschedule alarm for retry
				await this.state.storage.setAlarm(Date.now() + 1000);
			} else {
				console.error(`Job ${job.id} failed after 3 attempts`);
				// Update status in D1 to FAILED
				try {
					await this.env.ai_minuts
						.prepare("UPDATE Minuts SET status = ? WHERE id = ?")
						.bind("FAILED", job.payload.minutsId)
						.run();
				} catch (dbError) {
					console.error("Failed to update D1 status:", dbError);
				}

				// Fail job
				await this.fail(job.id, String(e));
			}
		}
	}
}
