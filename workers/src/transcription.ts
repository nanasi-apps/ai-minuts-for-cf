// type AiBinding = Env["AI"];

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_CHUNK_RETRIES = 3;
const RETRY_DELAY_MS = 3000;
// const INTER_CHUNK_DELAY_MS = 500;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
	const bytes = new Uint8Array(buffer);
	let binary = "";

	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}

	return btoa(binary);
};

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
	env: Env,
): Promise<{ transcript: string; vtt: string }> {
	if (!object.body) {
		throw new Error("Object body is null");
	}

	const ai = env.AI;
	const contentType = object.httpMetadata?.contentType || "audio/mpeg";
	let audioBuffer: ArrayBuffer;

	audioBuffer = await object.arrayBuffer();

	console.log(
		`[Transcription] Audio size: ${audioBuffer.byteLength}, Content-Type: ${contentType}`,
	);

	if (contentType === "video/mp4") {
		throw new Error(
			"Video files cannot be transcribed directly. Please upload an extracted audio file.",
		);
	}

	const totalChunks = Math.ceil(audioBuffer.byteLength / CHUNK_SIZE);

	console.log(`[Transcription] Splitting into ${totalChunks} chunks...`);
	const startTime = Date.now();

	// Prepare chunks
	const chunks = [];
	for (let i = 0; i < audioBuffer.byteLength; i += CHUNK_SIZE) {
		const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
		chunks.push({
			index: chunkIndex,
			buffer: audioBuffer.slice(i, i + CHUNK_SIZE),
		});
	}

	// Process chunks in parallel with concurrency limit
	const CONCURRENCY = 5;
	const results: {
		index: number;
		segments: TranscriptionSegment[];
		duration: number;
	}[] = [];
	const executing = new Set<Promise<void>>();

	const processChunk = async (chunk: {
		index: number;
		buffer: ArrayBuffer;
	}) => {
		const chunkIndex = chunk.index;
		console.log(
			`[Transcription] Processing chunk ${chunkIndex}/${totalChunks}...`,
		);
		const base64Audio = arrayBufferToBase64(chunk.buffer);

		let attempt = 0;
		let success = false;
		let chunkSegments: TranscriptionSegment[] = [];
		let duration = 0;

		while (attempt < MAX_CHUNK_RETRIES && !success) {
			attempt++;
			try {
				const whisperResponse = await ai.run(
					"@cf/openai/whisper-large-v3-turbo",
					{
						audio: base64Audio,
						language: "ja",
					},
				);

				if (whisperResponse.segments) {
					chunkSegments = whisperResponse.segments.map((segment) => ({
						start: segment.start ?? 0,
						end: segment.end ?? segment.start ?? 0,
						text: segment.text ?? "",
					}));

					duration =
						whisperResponse.transcription_info?.duration ||
						(chunkSegments.length > 0
							? chunkSegments[chunkSegments.length - 1].end
							: 0);
				} else if (whisperResponse.text) {
					chunkSegments = [
						{
							start: 0,
							end: 1,
							text: whisperResponse.text,
						},
					];
					duration = 10; // Fallback duration
				} else {
					console.warn(`[Transcription] Chunk ${chunkIndex}: No text found.`);
				}
				success = true;
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

		if (!success) {
			console.error(
				`[Transcription] Failed to process chunk ${chunkIndex} after ${MAX_CHUNK_RETRIES} attempts. Skipping.`,
			);
		}

		results.push({ index: chunkIndex, segments: chunkSegments, duration });
	};

	for (const chunk of chunks) {
		const p = processChunk(chunk).then(() => {
			executing.delete(p);
		});
		executing.add(p);

		if (executing.size >= CONCURRENCY) {
			await Promise.race(executing);
		}
	}

	await Promise.all(executing);

	// Sort results by index
	results.sort((a, b) => a.index - b.index);

	// Combine segments with correct time offsets
	let timeOffset = 0;
	const allSegments: TranscriptionSegment[] = [];

	for (const result of results) {
		const adjustedSegments = result.segments.map((segment) => ({
			start: segment.start + timeOffset,
			end: segment.end + timeOffset,
			text: segment.text,
		}));
		allSegments.push(...adjustedSegments);
		timeOffset += result.duration;
	}

	const endTime = Date.now();
	console.log(
		`[Transcription] Completed in ${(endTime - startTime) / 1000} seconds.`,
	);

	const transcript = allSegments
		.map(
			(segment) =>
				`[${segment.start.toFixed(2)} - ${segment.end.toFixed(2)}] ${segment.text}`,
		)
		.join("\n");

	const vtt = generateWebVtt(allSegments);

	return { transcript, vtt };
}

function generateWebVtt(segments: TranscriptionSegment[]): string {
	let vtt = "WEBVTT\n\n";
	segments.forEach((segment) => {
		const start = formatTime(segment.start);
		const end = formatTime(segment.end);
		vtt += `${start} --> ${end}\n${segment.text}\n\n`;
	});
	return vtt;
}

function formatTime(seconds: number): string {
	const date = new Date(0);
	date.setMilliseconds(seconds * 1000);
	const hh = date.getUTCHours().toString().padStart(2, "0");
	const mm = date.getUTCMinutes().toString().padStart(2, "0");
	const ss = date.getUTCSeconds().toString().padStart(2, "0");
	const ms = date.getUTCMilliseconds().toString().padStart(3, "0");
	return `${hh}:${mm}:${ss}.${ms}`;
}
