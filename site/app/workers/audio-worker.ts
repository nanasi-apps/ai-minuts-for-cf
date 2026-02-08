import { Mp3Encoder } from "@breezystack/lamejs";

interface EncodeMessage {
	type: "encode";
	samples: Float32Array;
	sampleRate: number;
	channels: number;
	bitrate: number;
}

interface ProgressMessage {
	type: "progress";
	percentage: number;
	stage: string;
}

interface ResultMessage {
	type: "result";
	mp3Buffer: ArrayBuffer;
}

interface ErrorMessage {
	type: "error";
	error: string;
}

type WorkerMessage =
	| EncodeMessage
	| ProgressMessage
	| ResultMessage
	| ErrorMessage;

function samplesToMp3(
	samples: Float32Array,
	sampleRate: number,
	channels: number,
	bitrate: number,
	onProgress?: (percentage: number, stage: string) => void,
): ArrayBuffer {
	console.log("[Worker] Encoding to MP3...");

	const sampleData = new Int16Array(samples.length);

	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
		sampleData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
	}

	const encoder = new Mp3Encoder(channels, sampleRate, bitrate);
	const mp3Data: Uint8Array[] = [];
	const blockSize = 1152;

	const totalBlocks = Math.ceil(sampleData.length / blockSize);

	for (let i = 0; i < sampleData.length; i += blockSize) {
		const chunk = sampleData.subarray(i, i + blockSize);
		const mp3buf = encoder.encodeBuffer(chunk);
		if (mp3buf.length > 0) {
			mp3Data.push(mp3buf);
		}

		if (onProgress) {
			const progress = Math.floor((i / blockSize / totalBlocks) * 50) + 50;
			onProgress(progress, "MP3にエンコード中");
		}
	}

	const mp3buf = encoder.flush();
	if (mp3buf.length > 0) {
		mp3Data.push(mp3buf);
	}

	console.log("[Worker] Encoding complete");

	const totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of mp3Data) {
		combined.set(arr, offset);
		offset += arr.length;
	}

	return combined.buffer;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
	const message = event.data;

	try {
		switch (message.type) {
			case "encode": {
				const { samples, sampleRate, channels, bitrate } = message;

				self.postMessage({
					type: "progress",
					percentage: 40,
					stage: "MP3エンコード準備中",
				} satisfies ProgressMessage);

				const mp3Buffer = samplesToMp3(
					samples,
					sampleRate,
					channels,
					bitrate,
					(percentage: number, stage: string) => {
						self.postMessage({
							type: "progress",
							percentage,
							stage,
						} satisfies ProgressMessage);
					},
				);

				self.postMessage({
					type: "result",
					mp3Buffer,
				} satisfies ResultMessage);
				break;
			}

			default:
				// biome-ignore lint/suspicious/noExplicitAny: type check for exhaustive switch
				throw new Error(`Unknown message type: ${(message as any).type}`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("[Worker] Error:", {
			error: errorMessage,
			message: event.data,
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});
		self.postMessage({
			type: "error",
			error: errorMessage,
		} satisfies ErrorMessage);
	}
};
