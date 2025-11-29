import { Buffer } from "node:buffer";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_CHUNK_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
const INTER_CHUNK_DELAY_MS = 500;

interface TranscriptionSegment {
	start: number;
	end: number;
	text: string;
}

/**
 * Transcribe audio stored in R2 using Whisper with chunking support.
 */
export async function transcribeAudio(
	object: R2ObjectBody,
	ai: Ai,
): Promise<string> {
	if (!object.body) {
		throw new Error("Object body is null");
	}

	const audioBuffer = await object.arrayBuffer();
	const contentType = object.httpMetadata?.contentType || "audio/mpeg";
	console.log(
		`[Transcription] Audio size: ${audioBuffer.byteLength}, Content-Type: ${contentType}`,
	);

	const allSegments: TranscriptionSegment[] = [];
	let timeOffset = 0;
	const totalChunks = Math.ceil(audioBuffer.byteLength / CHUNK_SIZE);

	console.log(`[Transcription] Splitting into ${totalChunks} chunks...`);
	const startTime = Date.now();

	for (let i = 0; i < audioBuffer.byteLength; i += CHUNK_SIZE) {
		const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
		console.log(
			`[Transcription] Processing chunk ${chunkIndex}/${totalChunks}...`,
		);

		const chunk = audioBuffer.slice(i, i + CHUNK_SIZE);
		const base64Audio = Buffer.from(chunk).toString("base64");

		let chunkSuccess = false;
		let attempt = 0;

		while (attempt < MAX_CHUNK_RETRIES && !chunkSuccess) {
			attempt++;
			try {
				const whisperResponse = (await ai.run(
					"@cf/openai/whisper-large-v3-turbo",
					{
						audio: base64Audio,
						language: "ja",
					},
				)) as any;

				if (whisperResponse.segments) {
					const chunkSegments = whisperResponse.segments.map((s: any) => ({
						start: s.start + timeOffset,
						end: s.end + timeOffset,
						text: s.text,
					}));
					allSegments.push(...chunkSegments);

					const duration =
						whisperResponse.transcription_info?.duration ||
						(chunkSegments.length > 0
							? chunkSegments[chunkSegments.length - 1].end - timeOffset
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
					console.warn(`[Transcription] Chunk ${chunkIndex}: No text found.`);
				}
				chunkSuccess = true;
			} catch (e) {
				console.error(
					`[Transcription] Error processing chunk ${chunkIndex} (Attempt ${attempt}/${MAX_CHUNK_RETRIES}):`,
					e,
				);
				if (attempt < MAX_CHUNK_RETRIES) {
					console.log(`[Transcription] Retrying chunk ${chunkIndex} in 3s...`);
					await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
				}
			}
		}

		if (!chunkSuccess) {
			console.error(
				`[Transcription] Failed to process chunk ${chunkIndex} after ${MAX_CHUNK_RETRIES} attempts. Skipping.`,
			);
		}

		await new Promise((resolve) => setTimeout(resolve, INTER_CHUNK_DELAY_MS));
	}

	const endTime = Date.now();
	console.log(
		`[Transcription] Completed in ${(endTime - startTime) / 1000} seconds.`,
	);

	return allSegments
		.map(
			(segment) =>
				`[${segment.start.toFixed(2)} - ${segment.end.toFixed(2)}] ${segment.text}`,
		)
		.join("\n");
}
